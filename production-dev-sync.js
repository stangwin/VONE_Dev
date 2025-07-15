/**
 * Production-to-Development Database Synchronization Tool
 * Ensures development database matches production exactly
 * Production is the permanent source of truth
 */

const { Pool } = require('pg');
require('dotenv').config();

class ProductionDevSync {
  constructor() {
    this.prodPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.devPool = new Pool({
      connectionString: process.env.DATABASE_URL_DEV || process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.tables = ['customers', 'customer_notes', 'customer_files', 'users', 'affiliates', 'affiliate_aes'];
    this.maxRetries = 3;
    this.syncReport = {
      startTime: new Date(),
      tables: {},
      retries: 0,
      success: false
    };
  }

  async validateSync() {
    console.log('🔍 Starting Production-to-Development Sync Validation...');
    
    let syncAttempt = 0;
    let syncComplete = false;
    
    while (!syncComplete && syncAttempt < this.maxRetries) {
      syncAttempt++;
      console.log(`\n📊 Sync Attempt ${syncAttempt}/${this.maxRetries}`);
      
      const differences = await this.compareAllTables();
      
      if (differences.length === 0) {
        console.log('✅ SUCCESS: Development database matches Production exactly!');
        syncComplete = true;
        this.syncReport.success = true;
      } else {
        console.log(`❌ Found ${differences.length} differences between Production and Development`);
        console.log('🔄 Performing corrective sync...');
        
        await this.performCorrectiveSync(differences);
        
        if (syncAttempt < this.maxRetries) {
          console.log('⏳ Waiting 2 seconds before re-validation...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    this.syncReport.retries = syncAttempt;
    this.syncReport.endTime = new Date();
    
    if (!syncComplete) {
      console.log('❌ FAILED: Could not achieve exact sync after maximum retries');
      this.syncReport.success = false;
    }
    
    await this.generateSyncReport();
    return syncComplete;
  }

  async compareAllTables() {
    const differences = [];
    
    for (const table of this.tables) {
      try {
        const tableDiff = await this.compareTable(table);
        if (tableDiff.hasDifferences) {
          differences.push(tableDiff);
        }
        
        this.syncReport.tables[table] = {
          prodCount: tableDiff.prodCount,
          devCount: tableDiff.devCount,
          differences: tableDiff.differences,
          status: tableDiff.hasDifferences ? 'MISMATCH' : 'MATCH'
        };
        
      } catch (error) {
        console.error(`❌ Error comparing table ${table}:`, error.message);
        differences.push({
          table,
          error: error.message,
          hasDifferences: true
        });
      }
    }
    
    return differences;
  }

  async compareTable(table) {
    const prodSchema = '';
    const devSchema = 'vantix_dev.';
    
    // Get record counts
    const prodCountResult = await this.prodPool.query(`SELECT COUNT(*) as count FROM ${prodSchema}${table}`);
    const devCountResult = await this.devPool.query(`SELECT COUNT(*) as count FROM ${devSchema}${table}`);
    
    const prodCount = parseInt(prodCountResult.rows[0].count);
    const devCount = parseInt(devCountResult.rows[0].count);
    
    console.log(`📋 ${table}: Production=${prodCount}, Development=${devCount}`);
    
    const differences = [];
    
    // Count mismatch is a difference
    if (prodCount !== devCount) {
      differences.push({
        type: 'COUNT_MISMATCH',
        production: prodCount,
        development: devCount
      });
    }
    
    // Compare actual data for critical tables
    if (['customers', 'customer_notes', 'customer_files'].includes(table)) {
      const dataDifferences = await this.compareTableData(table, prodSchema, devSchema);
      differences.push(...dataDifferences);
    }
    
    return {
      table,
      prodCount,
      devCount,
      differences,
      hasDifferences: differences.length > 0
    };
  }

  async compareTableData(table, prodSchema, devSchema) {
    const differences = [];
    
    try {
      // Get all records from production
      const prodResult = await this.prodPool.query(`SELECT * FROM ${prodSchema}${table} ORDER BY id`);
      const devResult = await this.devPool.query(`SELECT * FROM ${devSchema}${table} ORDER BY id`);
      
      const prodRecords = prodResult.rows;
      const devRecords = devResult.rows;
      
      // Compare each production record
      for (const prodRecord of prodRecords) {
        const devRecord = devRecords.find(r => r.id === prodRecord.id);
        
        if (!devRecord) {
          differences.push({
            type: 'MISSING_IN_DEV',
            record: prodRecord,
            table
          });
        } else {
          // Compare key fields
          const keyFields = this.getKeyFields(table);
          for (const field of keyFields) {
            if (this.normalizeValue(prodRecord[field]) !== this.normalizeValue(devRecord[field])) {
              differences.push({
                type: 'FIELD_MISMATCH',
                field,
                prodValue: prodRecord[field],
                devValue: devRecord[field],
                recordId: prodRecord.id,
                table
              });
            }
          }
        }
      }
      
      // Check for extra records in development
      for (const devRecord of devRecords) {
        const prodRecord = prodRecords.find(r => r.id === devRecord.id);
        if (!prodRecord) {
          differences.push({
            type: 'EXTRA_IN_DEV',
            record: devRecord,
            table
          });
        }
      }
      
    } catch (error) {
      console.error(`Error comparing data for ${table}:`, error.message);
      differences.push({
        type: 'COMPARISON_ERROR',
        error: error.message,
        table
      });
    }
    
    return differences;
  }

  getKeyFields(table) {
    const keyFields = {
      customers: ['customer_id', 'company_name', 'status', 'affiliate_partner', 'next_step', 'affiliate_account_executive'],
      customer_notes: ['customer_id', 'content', 'created_at', 'created_by'],
      customer_files: ['customer_id', 'file_name', 'original_name', 'file_url'],
      users: ['email', 'name', 'role'],
      affiliates: ['name'],
      affiliate_aes: ['affiliate_id', 'name']
    };
    
    return keyFields[table] || ['id'];
  }

  normalizeValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value.trim();
    if (value instanceof Date) return value.toISOString();
    return value;
  }

  async performCorrectiveSync(differences) {
    console.log('🔧 Performing corrective synchronization...');
    
    for (const diff of differences) {
      try {
        await this.correctTableDifferences(diff);
      } catch (error) {
        console.error(`❌ Failed to correct differences for ${diff.table}:`, error.message);
      }
    }
  }

  async correctTableDifferences(diff) {
    const { table } = diff;
    const devSchema = 'vantix_dev.';
    
    console.log(`🔄 Correcting ${table}...`);
    
    try {
      // Check if table exists in development schema
      const tableExists = await this.devPool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'vantix_dev' AND table_name = $1
        )
      `, [table]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`⚠️  Table ${table} does not exist in development schema, skipping...`);
        return;
      }
      
      // Get production table structure
      const prodColumns = await this.prodPool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      
      // Get development table structure
      const devColumns = await this.devPool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'vantix_dev'
        ORDER BY ordinal_position
      `, [table]);
      
      const prodColumnNames = prodColumns.rows.map(r => r.column_name);
      const devColumnNames = devColumns.rows.map(r => r.column_name);
      
      // Find matching columns (excluding id which is auto-generated)
      const matchingColumns = prodColumnNames.filter(col => 
        col !== 'id' && devColumnNames.includes(col)
      );
      
      if (matchingColumns.length === 0) {
        console.log(`⚠️  No matching columns found for ${table}, skipping...`);
        return;
      }
      
      // Clear development table completely
      await this.devPool.query(`TRUNCATE ${devSchema}${table} RESTART IDENTITY CASCADE`);
      
      // Copy all data from production using only matching columns
      const prodData = await this.prodPool.query(`SELECT ${matchingColumns.join(', ')} FROM ${table} ORDER BY id`);
      
      if (prodData.rows.length > 0) {
        const placeholders = matchingColumns.map((_, index) => `$${index + 1}`).join(', ');
        const columnNames = matchingColumns.join(', ');
        
        const insertQuery = `
          INSERT INTO ${devSchema}${table} (${columnNames})
          VALUES (${placeholders})
        `;
        
        for (const row of prodData.rows) {
          const values = matchingColumns.map(col => row[col]);
          await this.devPool.query(insertQuery, values);
        }
      }
      
      console.log(`✅ Synchronized ${prodData.rows.length} records for ${table} (${matchingColumns.length} columns)`);
      
    } catch (error) {
      console.error(`❌ Failed to correct ${table}:`, error.message);
    }
  }

  async generateSyncReport() {
    const duration = (this.syncReport.endTime - this.syncReport.startTime) / 1000;
    
    console.log('\n📊 SYNCHRONIZATION REPORT');
    console.log('==========================');
    console.log(`Start Time: ${this.syncReport.startTime.toISOString()}`);
    console.log(`End Time: ${this.syncReport.endTime.toISOString()}`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Attempts: ${this.syncReport.retries}`);
    console.log(`Status: ${this.syncReport.success ? 'SUCCESS' : 'FAILED'}`);
    console.log('\nTable Status:');
    
    for (const [table, info] of Object.entries(this.syncReport.tables)) {
      console.log(`  ${table}: ${info.status} (Prod: ${info.prodCount}, Dev: ${info.devCount})`);
    }
    
    // Save report to file
    const reportPath = `./sync-report-${Date.now()}.json`;
    const fs = require('fs');
    fs.writeFileSync(reportPath, JSON.stringify(this.syncReport, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  async close() {
    await this.prodPool.end();
    await this.devPool.end();
  }
}

// CLI execution
async function main() {
  const sync = new ProductionDevSync();
  
  try {
    const success = await sync.validateSync();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Sync process failed:', error);
    process.exit(1);
  } finally {
    await sync.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductionDevSync;