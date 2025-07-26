#!/usr/bin/env node

/**
 * Development Database Setup Script
 * Sets up a development database with real customer data from production backup
 */

const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

console.log('🔧 VONE Development Database Setup');
console.log('==================================');

// Help text if no DATABASE_URL_DEV provided
if (!process.env.DATABASE_URL_DEV) {
  console.log(`
❌ Missing DATABASE_URL_DEV in .env file

To set up your development database:

1. Create a new database (recommended providers):
   • Neon (https://neon.tech) - Free tier available
   • Supabase (https://supabase.com) - Free tier available  
   • Railway (https://railway.app) - Simple PostgreSQL
   • Render PostgreSQL - Same provider as your app

2. Add to your .env file:
   DATABASE_URL_DEV=postgresql://user:password@host:port/database_name

3. Run this script again:
   node setup-dev-database.js

📁 Available backup files:
${fs.readdirSync('.').filter(f => f.endsWith('.sql')).map(f => `   • ${f}`).join('\n') || '   (No .sql files found)'}
`);
  process.exit(1);
}

async function setupDevelopmentDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_DEV,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Check if we have customer data
    const customerCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'customers'
    `);

    if (customerCheck.rows.length === 0) {
      console.log('📋 No customer table found. Database appears empty.');
      
      // Check for backup files
      const backupFiles = fs.readdirSync('.').filter(f => f.endsWith('.sql'));
      if (backupFiles.length > 0) {
        console.log(`\n📁 Found backup files:`);
        backupFiles.forEach((file, i) => {
          console.log(`   ${i + 1}. ${file}`);
        });
        console.log(`\n💡 To import data, run:`);
        console.log(`   psql "your_dev_database_url" < ${backupFiles[backupFiles.length - 1]}`);
      }
    } else {
      // Check customer count
      const customerCount = await pool.query('SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL');
      console.log(`✅ Found ${customerCount.rows[0].count} active customers in development database`);
      
      // Show sample customers
      const sampleCustomers = await pool.query(`
        SELECT customer_id, company_name, status 
        FROM customers 
        WHERE deleted_at IS NULL 
        ORDER BY company_name 
        LIMIT 5
      `);
      
      console.log(`\n📊 Sample customers:`);
      sampleCustomers.rows.forEach(customer => {
        console.log(`   • ${customer.company_name} (${customer.customer_id}) - ${customer.status}`);
      });
    }

    console.log(`\n🚀 Development database is ready!`);
    console.log(`📍 Connection: ${process.env.DATABASE_URL_DEV.split('@')[1]?.split('?')[0]}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Check your DATABASE_URL_DEV connection string');
  } finally {
    await pool.end();
  }
}

setupDevelopmentDatabase(); 