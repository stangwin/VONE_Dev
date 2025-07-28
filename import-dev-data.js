#!/usr/bin/env node
/**
 * Development Data Import Script
 * Imports CSV data files into the development database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Environment detection
const isDevelopment = process.env.ENVIRONMENT === 'development';
if (!isDevelopment) {
  console.error('❌ This script can only run in development mode');
  process.exit(1);
}

// Database connection
const databaseUrl = process.env.DATABASE_URL_DEV;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL_DEV not configured');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

// Helper function to parse JSON strings from CSV
function parseJsonField(field) {
  if (!field || field === 'null' || field === '') return null;
  try {
    return JSON.parse(field);
  } catch (e) {
    console.warn(`⚠️  Failed to parse JSON field: ${field}`);
    return null;
  }
}

// Helper function to clean CSV data
function cleanCsvValue(value) {
  if (value === 'null' || value === '') return null;
  return value;
}

async function importAffiliates() {
  console.log('📊 Importing affiliates...');
  
  const csvPath = path.join(__dirname, 'temporary database files', 'exported_data_affiliates.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const affiliate = {
      id: values[0],
      name: values[1],
      created_at: values[2],
      updated_at: values[3]
    };
    
    try {
      await pool.query(`
        INSERT INTO affiliates (id, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          updated_at = EXCLUDED.updated_at
      `, [affiliate.id, affiliate.name, affiliate.created_at, affiliate.updated_at]);
      
      console.log(`✅ Imported affiliate: ${affiliate.name}`);
    } catch (error) {
      console.error(`❌ Failed to import affiliate ${affiliate.name}:`, error.message);
    }
  }
}

async function importCustomers() {
  console.log('📊 Importing customers...');
  
  const csvPath = path.join(__dirname, 'temporary database files', 'exported_data_customers.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    // Parse JSON fields
    const primaryContact = parseJsonField(values[8]);
    const authorizedSigner = parseJsonField(values[9]);
    const billingContact = parseJsonField(values[10]);
    const premiseLocations = parseJsonField(values[16]);
    
    const customer = {
      id: parseInt(values[0]),
      customer_id: values[1],
      company_name: values[2],
      status: values[3],
      affiliate_partner: values[4],
      next_step: values[5],
      physical_address: cleanCsvValue(values[6]),
      billing_address: cleanCsvValue(values[7]),
      primary_contact: primaryContact,
      authorized_signer: authorizedSigner,
      billing_contact: billingContact,
      created_at: values[11],
      updated_at: values[12],
      created_by: cleanCsvValue(values[13]),
      updated_by: cleanCsvValue(values[14]),
      affiliate_account_executive: cleanCsvValue(values[15]),
      premise_locations: premiseLocations,
      docusign_status: cleanCsvValue(values[17]),
      notes: cleanCsvValue(values[18]),
      deleted_at: cleanCsvValue(values[19]),
      next_step_due: cleanCsvValue(values[20])
    };
    
    try {
      await pool.query(`
        INSERT INTO customers (
          id, customer_id, company_name, status, affiliate_partner, next_step,
          physical_address, billing_address, primary_contact, authorized_signer,
          billing_contact, created_at, updated_at, created_by, updated_by,
          affiliate_account_executive, premise_locations, docusign_status, notes,
          deleted_at, next_step_due
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21
        ) ON CONFLICT (id) DO UPDATE SET
          customer_id = EXCLUDED.customer_id,
          company_name = EXCLUDED.company_name,
          status = EXCLUDED.status,
          affiliate_partner = EXCLUDED.affiliate_partner,
          next_step = EXCLUDED.next_step,
          physical_address = EXCLUDED.physical_address,
          billing_address = EXCLUDED.billing_address,
          primary_contact = EXCLUDED.primary_contact,
          authorized_signer = EXCLUDED.authorized_signer,
          billing_contact = EXCLUDED.billing_contact,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          affiliate_account_executive = EXCLUDED.affiliate_account_executive,
          premise_locations = EXCLUDED.premise_locations,
          docusign_status = EXCLUDED.docusign_status,
          notes = EXCLUDED.notes,
          deleted_at = EXCLUDED.deleted_at,
          next_step_due = EXCLUDED.next_step_due
      `, [
        customer.id, customer.customer_id, customer.company_name, customer.status,
        customer.affiliate_partner, customer.next_step, customer.physical_address,
        customer.billing_address, customer.primary_contact, customer.authorized_signer,
        customer.billing_contact, customer.created_at, customer.updated_at,
        customer.created_by, customer.updated_by, customer.affiliate_account_executive,
        customer.premise_locations, customer.docusign_status, customer.notes,
        customer.deleted_at, customer.next_step_due
      ]);
      
      console.log(`✅ Imported customer: ${customer.company_name} (${customer.customer_id})`);
    } catch (error) {
      console.error(`❌ Failed to import customer ${customer.company_name}:`, error.message);
    }
  }
}

async function importCustomerNotes() {
  console.log('📊 Importing customer notes...');
  
  const csvPath = path.join(__dirname, 'temporary database files', 'exported_data_customer_notes.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    const note = {
      id: parseInt(values[0]),
      customer_id: parseInt(values[1]),
      content: values[2],
      author_name: values[3],
      timestamp: values[4]
    };
    
    try {
      await pool.query(`
        INSERT INTO customer_notes (id, customer_id, content, author_name, timestamp)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          author_name = EXCLUDED.author_name,
          timestamp = EXCLUDED.timestamp
      `, [note.id, note.customer_id, note.content, note.author_name, note.timestamp]);
      
      console.log(`✅ Imported note for customer ${note.customer_id}`);
    } catch (error) {
      console.error(`❌ Failed to import note for customer ${note.customer_id}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting development data import...');
  console.log(`📊 Database: ${databaseUrl.substring(0, 30)}...`);
  
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Import data in order
    await importAffiliates();
    await importCustomers();
    await importCustomerNotes();
    
    console.log('🎉 Data import completed successfully!');
    
    // Show summary
    const customerCount = await pool.query('SELECT COUNT(*) FROM customers');
    const affiliateCount = await pool.query('SELECT COUNT(*) FROM affiliates');
    const noteCount = await pool.query('SELECT COUNT(*) FROM customer_notes');
    
    console.log('\n📊 Import Summary:');
    console.log(`   Customers: ${customerCount.rows[0].count}`);
    console.log(`   Affiliates: ${affiliateCount.rows[0].count}`);
    console.log(`   Notes: ${noteCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}

main(); 