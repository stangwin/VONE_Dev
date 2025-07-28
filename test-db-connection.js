#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL_DEV;
console.log('Testing connection to:', databaseUrl);

const pool = new Pool({ connectionString: databaseUrl });

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    
    // Test if tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Available tables:', tables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testConnection(); 