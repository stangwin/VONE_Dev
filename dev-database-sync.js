/**
 * Database Synchronization Tool
 * Compares Development and Production databases
 * Provides selective sync capabilities with Production as source of truth
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class DatabaseSyncTool {
    constructor() {
        this.prodPool = null;
        this.devPool = null;
        this.comparisonReport = {
            timestamp: new Date().toISOString(),
            missingInProd: {},
            missingInDev: {},
            summary: {},
            recommendations: []
        };
    }

    async init() {
        // Load environment variables
        require('dotenv').config();
        
        // Production database (source of truth)
        const prodUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
        if (!prodUrl) {
            throw new Error('Production database URL not found');
        }
        this.prodPool = new Pool({
            connectionString: prodUrl,
            ssl: { rejectUnauthorized: false }
        });

        // Development database with strict validation
        const devUrl = process.env.DATABASE_URL_DEV;
        if (!devUrl) {
            throw new Error('DATABASE_URL_DEV is required for database comparison. Please create a separate development database.');
        }
        if (devUrl === prodUrl) {
            throw new Error('🚨 DATABASE_URL_DEV cannot be the same as production URL. Environment isolation required.');
        }
        this.devPool = new Pool({
            connectionString: devUrl,
            ssl: { rejectUnauthorized: false }
        });

        console.log('🔄 Database Sync Tool initialized');
        console.log('📊 Production DB:', prodUrl.substring(0, 50) + '...');
        console.log('🚧 Development DB:', devUrl.substring(0, 50) + '...');
        
        // Verify connections work
        try {
            await this.prodPool.query('SELECT 1');
            await this.devPool.query('SELECT 1');
        } catch (error) {
            console.error('Database connection test failed:', error);
            throw error;
        }
    }

    async compareTable(tableName, primaryKey = 'id') {
        console.log(`\n📋 Comparing table: ${tableName}`);
        
        try {
            // Get records from both databases
            const prodResult = await this.prodPool.query(`SELECT * FROM ${tableName} ORDER BY ${primaryKey}`);
            const devResult = await this.devPool.query(`SELECT * FROM ${tableName} ORDER BY ${primaryKey}`);

            const prodRecords = prodResult.rows;
            const devRecords = devResult.rows;

            console.log(`   📊 Production: ${prodRecords.length} records`);
            console.log(`   🚧 Development: ${devRecords.length} records`);

            // Create maps for efficient comparison
            const prodMap = new Map();
            const devMap = new Map();

            prodRecords.forEach(record => {
                const key = record[primaryKey];
                prodMap.set(key, record);
            });

            devRecords.forEach(record => {
                const key = record[primaryKey];
                devMap.set(key, record);
            });

            // Find missing records
            const missingInProd = [];
            const missingInDev = [];

            // Records in Dev but not in Prod
            for (const [key, record] of devMap) {
                if (!prodMap.has(key)) {
                    missingInProd.push(record);
                }
            }

            // Records in Prod but not in Dev
            for (const [key, record] of prodMap) {
                if (!devMap.has(key)) {
                    missingInDev.push(record);
                }
            }

            // Store results
            this.comparisonReport.missingInProd[tableName] = missingInProd;
            this.comparisonReport.missingInDev[tableName] = missingInDev;

            console.log(`   ⚠️  Missing in Prod: ${missingInProd.length}`);
            console.log(`   ⚠️  Missing in Dev: ${missingInDev.length}`);

            return { missingInProd, missingInDev };
        } catch (error) {
            console.error(`❌ Error comparing ${tableName}:`, error.message);
            return { missingInProd: [], missingInDev: [], error: error.message };
        }
    }

    async generateReport() {
        console.log('\n🔍 Starting comprehensive database comparison...');
        
        // Compare critical tables
        const tablesToCompare = [
            { name: 'customers', key: 'id' },
            { name: 'customer_files', key: 'id' },
            { name: 'customer_notes', key: 'id' },
            { name: 'users', key: 'id' }
        ];

        for (const table of tablesToCompare) {
            await this.compareTable(table.name, table.key);
        }

        // Generate summary
        this.comparisonReport.summary = {
            totalMissingInProd: Object.values(this.comparisonReport.missingInProd)
                .reduce((sum, records) => sum + records.length, 0),
            totalMissingInDev: Object.values(this.comparisonReport.missingInDev)
                .reduce((sum, records) => sum + records.length, 0)
        };

        // Generate recommendations
        this.generateRecommendations();

        return this.comparisonReport;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check for critical missing data
        const missingCustomersInProd = this.comparisonReport.missingInProd.customers?.length || 0;
        const missingFilesInProd = this.comparisonReport.missingInProd.customer_files?.length || 0;
        const missingNotesInProd = this.comparisonReport.missingInProd.customer_notes?.length || 0;

        if (missingCustomersInProd > 0) {
            recommendations.push({
                priority: 'HIGH',
                type: 'MISSING_CUSTOMERS',
                message: `${missingCustomersInProd} customer records exist in Dev but not in Prod. These should be reviewed for potential sync.`
            });
        }

        if (missingFilesInProd > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                type: 'MISSING_FILES',
                message: `${missingFilesInProd} file records exist in Dev but not in Prod. Check if these files were uploaded to the wrong environment.`
            });
        }

        if (missingNotesInProd > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                type: 'MISSING_NOTES',
                message: `${missingNotesInProd} note records exist in Dev but not in Prod. These might contain important customer interactions.`
            });
        }

        // Check for data in Dev that shouldn't be there
        const totalMissingInDev = this.comparisonReport.summary.totalMissingInDev;
        if (totalMissingInDev > 0) {
            recommendations.push({
                priority: 'INFO',
                type: 'PROD_NEWER_DATA',
                message: `Production has ${totalMissingInDev} records not in Dev. This is expected since Prod is the source of truth.`
            });
        }

        this.comparisonReport.recommendations = recommendations;
    }

    async syncRecordToProd(tableName, record, primaryKey = 'id') {
        console.log(`🔄 Syncing ${tableName} record ${record[primaryKey]} to Production...`);
        
        try {
            // Get table structure
            const tableInfo = await this.prodPool.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = $1 
                ORDER BY ordinal_position
            `, [tableName]);

            const columns = tableInfo.rows.map(row => row.column_name);
            const values = columns.map(col => record[col]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

            const query = `
                INSERT INTO ${tableName} (${columns.join(', ')}) 
                VALUES (${placeholders})
                ON CONFLICT (${primaryKey}) DO UPDATE SET
                ${columns.filter(col => col !== primaryKey).map(col => `${col} = EXCLUDED.${col}`).join(', ')}
            `;

            await this.prodPool.query(query, values);
            console.log(`✅ Successfully synced ${tableName} record ${record[primaryKey]}`);
            return true;
        } catch (error) {
            console.error(`❌ Error syncing ${tableName} record ${record[primaryKey]}:`, error.message);
            return false;
        }
    }

    async generateSyncScript() {
        const script = {
            timestamp: new Date().toISOString(),
            operations: []
        };

        // Generate sync operations for each table
        for (const [tableName, records] of Object.entries(this.comparisonReport.missingInProd)) {
            if (records.length > 0) {
                script.operations.push({
                    table: tableName,
                    action: 'INSERT_FROM_DEV',
                    records: records.map(record => ({
                        id: record.id,
                        summary: this.getRecordSummary(tableName, record)
                    })),
                    count: records.length
                });
            }
        }

        return script;
    }

    getRecordSummary(tableName, record) {
        switch (tableName) {
            case 'customers':
                return `${record.company_name || 'N/A'} (${record.primary_contact_name || 'N/A'})`;
            case 'customer_files':
                return `${record.original_filename} for ${record.customer_id}`;
            case 'customer_notes':
                return `Note for ${record.customer_id}: ${record.content?.substring(0, 50) || 'N/A'}...`;
            case 'users':
                return `${record.name} (${record.email})`;
            default:
                return `Record ID: ${record.id}`;
        }
    }

    async saveReport() {
        const reportPath = path.join(__dirname, 'database-sync-report.json');
        await fs.writeFile(reportPath, JSON.stringify(this.comparisonReport, null, 2));
        console.log(`📄 Report saved to: ${reportPath}`);
        return reportPath;
    }

    async close() {
        if (this.prodPool) await this.prodPool.end();
        if (this.devPool) await this.devPool.end();
        console.log('🔐 Database connections closed');
    }
}

// CLI Interface
async function runComparison() {
    const syncTool = new DatabaseSyncTool();
    
    try {
        await syncTool.init();
        const report = await syncTool.generateReport();
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 DATABASE COMPARISON REPORT');
        console.log('='.repeat(60));
        console.log(`🕐 Generated: ${report.timestamp}`);
        console.log(`📈 Total missing in Production: ${report.summary.totalMissingInProd}`);
        console.log(`📉 Total missing in Development: ${report.summary.totalMissingInDev}`);
        
        // Show detailed breakdown
        console.log('\n📋 DETAILED BREAKDOWN:');
        for (const [table, records] of Object.entries(report.missingInProd)) {
            if (records.length > 0) {
                console.log(`\n   📦 ${table.toUpperCase()}:`);
                console.log(`      Missing in Prod: ${records.length}`);
                records.forEach((record, index) => {
                    if (index < 5) { // Show first 5 records
                        console.log(`      - ${syncTool.getRecordSummary(table, record)}`);
                    }
                });
                if (records.length > 5) {
                    console.log(`      ... and ${records.length - 5} more`);
                }
            }
        }

        // Show recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach(rec => {
            const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🔵';
            console.log(`   ${priority} ${rec.type}: ${rec.message}`);
        });

        // Save report
        await syncTool.saveReport();
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Comparison complete. Review the report above.');
        console.log('🔒 Production remains the source of truth.');
        console.log('⚠️  No data has been modified in either database.');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error during comparison:', error);
    } finally {
        await syncTool.close();
    }
}

// Export for use in other modules
module.exports = { DatabaseSyncTool, runComparison };

// Run if called directly
if (require.main === module) {
    runComparison();
}