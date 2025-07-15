#!/usr/bin/env node

/**
 * Complete Delete Functionality Test
 * Tests the archive/soft-delete functionality in development environment
 */

const { Pool } = require('pg');
const fs = require('fs');

// Test configuration
const CONFIG = {
  devPort: 3000,
  baseUrl: 'http://localhost:3000',
  testCustomerId: 'customer_test_automated',
  testUser: { id: 1, name: 'Test Admin', email: 'admin@test.com', role: 'admin' }
};

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Set schema for development
async function setDevSchema() {
  await pool.query('SET search_path TO vantix_dev');
}

// Test functions
async function createTestCustomer() {
  await setDevSchema();
  
  const result = await pool.query(
    `INSERT INTO customers (customer_id, company_name, status, primary_contact, authorized_signer, billing_contact, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
     RETURNING customer_id, company_name`,
    [
      CONFIG.testCustomerId,
      'Automated Test Customer',
      'Lead',
      '{"name": "Test User", "email": "test@example.com", "phone": "555-0123"}',
      '{"name": "Test User", "email": "test@example.com", "phone": "555-0123"}',
      '{"name": "Test User", "email": "test@example.com", "phone": "555-0123"}'
    ]
  );
  
  console.log('✓ Created test customer:', result.rows[0]);
  return result.rows[0];
}

async function createTestSession() {
  await setDevSchema();
  
  const sessionData = {
    userId: CONFIG.testUser.id,
    userEmail: CONFIG.testUser.email,
    isAuthenticated: CONFIG.testUser.id
  };
  
  await pool.query(
    `INSERT INTO session_dev (sid, sess, expire) 
     VALUES ($1, $2, NOW() + INTERVAL '1 hour') 
     ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
    ['test_delete_session', JSON.stringify(sessionData)]
  );
  
  console.log('✓ Created test session');
  return 'test_delete_session';
}

async function testDeleteAPI(sessionId) {
  const response = await fetch(`${CONFIG.baseUrl}/api/customers/${CONFIG.testCustomerId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': `connect.sid=s%3A${sessionId}.test`
    }
  });
  
  const result = await response.json();
  
  console.log('Delete API Response:', response.status, result);
  
  if (response.status === 200) {
    console.log('✓ Delete API successful');
    return true;
  } else {
    console.log('✗ Delete API failed:', result);
    return false;
  }
}

async function verifyDatabaseState() {
  await setDevSchema();
  
  // Check if customer is soft-deleted
  const result = await pool.query(
    'SELECT customer_id, company_name, deleted_at FROM customers WHERE customer_id = $1',
    [CONFIG.testCustomerId]
  );
  
  if (result.rows.length === 0) {
    console.log('✗ Customer not found in database');
    return false;
  }
  
  const customer = result.rows[0];
  console.log('Customer state:', customer);
  
  if (customer.deleted_at) {
    console.log('✓ Customer successfully archived with timestamp:', customer.deleted_at);
    return true;
  } else {
    console.log('✗ Customer not archived - deleted_at is null');
    return false;
  }
}

async function testCustomerListAPI(sessionId) {
  const response = await fetch(`${CONFIG.baseUrl}/api/customers`, {
    headers: {
      'Cookie': `connect.sid=s%3A${sessionId}.test`
    }
  });
  
  if (!response.ok) {
    console.log('✗ Customer list API failed:', response.status);
    return false;
  }
  
  const customers = await response.json();
  const archivedCustomer = customers.find(c => c.customer_id === CONFIG.testCustomerId);
  
  if (archivedCustomer) {
    console.log('✗ Archived customer still visible in API results');
    return false;
  } else {
    console.log('✓ Archived customer properly excluded from API results');
    return true;
  }
}

async function cleanup() {
  await setDevSchema();
  
  // Remove test customer completely
  await pool.query('DELETE FROM customers WHERE customer_id = $1', [CONFIG.testCustomerId]);
  
  // Remove test session
  await pool.query('DELETE FROM session_dev WHERE sid = $1', ['test_delete_session']);
  
  console.log('✓ Test cleanup completed');
}

// Main test execution
async function runTests() {
  console.log('=== DELETE FUNCTIONALITY AUTOMATED TEST ===');
  
  try {
    // Setup
    console.log('\n1. Setting up test environment...');
    await createTestCustomer();
    const sessionId = await createTestSession();
    
    // Test delete API
    console.log('\n2. Testing delete API...');
    const deleteSuccess = await testDeleteAPI(sessionId);
    
    if (!deleteSuccess) {
      console.log('✗ Delete API test failed - stopping tests');
      await cleanup();
      return;
    }
    
    // Verify database state
    console.log('\n3. Verifying database state...');
    const dbStateCorrect = await verifyDatabaseState();
    
    if (!dbStateCorrect) {
      console.log('✗ Database state verification failed');
      await cleanup();
      return;
    }
    
    // Test customer list API
    console.log('\n4. Testing customer list API...');
    const listAPICorrect = await testCustomerListAPI(sessionId);
    
    if (!listAPICorrect) {
      console.log('✗ Customer list API test failed');
      await cleanup();
      return;
    }
    
    // Cleanup
    console.log('\n5. Cleaning up...');
    await cleanup();
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('✓ Customer archive functionality is working correctly');
    
  } catch (error) {
    console.error('✗ Test failed with error:', error);
    await cleanup();
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };