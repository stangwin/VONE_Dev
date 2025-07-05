# Database Synchronization Guide

## Overview

The Vantix CRM includes a comprehensive database synchronization system that allows you to compare Development and Production databases, identify discrepancies, and selectively sync missing records while maintaining Production as the permanent source of truth.

## Security Model

### Production as Source of Truth
- **Production database is ALWAYS the authoritative source**
- **Development cannot overwrite Production data without explicit approval**
- **All sync operations are additive only - no destructive operations**
- **Manual review required before any data moves to Production**

### Database Isolation
- Development environment uses `DATABASE_URL_DEV`
- Production environment uses `DATABASE_URL_PROD` or `DATABASE_URL`
- Cross-environment contamination prevented by URL validation
- SSL connections enforced for both environments

## How to Use the Sync System

### 1. Access the Database Comparison Tool

From your Development environment:
1. Log in to the CRM with your admin credentials
2. Access the Development Console at `/dev-console`
3. Navigate to the "Database Comparison" section

### 2. Run a Database Comparison

Click **"🔍 Compare Dev vs Prod Database"** to:
- Compare all critical tables (customers, customer_files, customer_notes, users)
- Identify records that exist in Development but not in Production
- Identify records that exist in Production but not in Development
- Generate comprehensive recommendations

### 3. Review the Comparison Report

The report shows:
- **Missing in Production**: Records in Dev that should potentially be synced to Prod
- **Missing in Development**: Records in Prod that are newer (expected behavior)
- **Recommendations**: Priority-based suggestions for data management

### 4. Selective Sync Process

If records are missing in Production:
1. Review each record in the selective sync panel
2. Check the boxes for records you want to sync to Production
3. Use "Select All" buttons for entire tables if appropriate
4. Click **"✅ Execute Selected Sync"** 
5. Confirm the operation in the safety dialog
6. Monitor the sync results

## What Gets Compared

### Tables Monitored
- **customers**: Core customer records and company information
- **customer_files**: File attachments and media uploads
- **customer_notes**: Customer interaction notes and history
- **users**: User accounts and authentication data

### Comparison Logic
- Primary key-based comparison for exact record matching
- Content-aware summaries for easy record identification
- Timestamp tracking for audit trails

## Safety Safeguards

### Before Sync
- Manual review required for all records
- Clear record summaries displayed for identification
- Confirmation dialog warns about Production database changes
- No automatic sync operations

### During Sync
- Individual record processing with error handling
- Detailed success/failure reporting
- Transaction-based operations
- Rollback capability on errors

### After Sync
- Comprehensive sync results displayed
- Success/failure count for transparency
- Automatic re-comparison to verify results
- Audit trail in server logs

## Common Use Cases

### 1. File Upload Recovery
If files were uploaded to Development instead of Production:
1. Run comparison to identify missing files in Production
2. Review file records in sync panel
3. Select relevant files for sync
4. Execute sync to move file records to Production

### 2. Customer Data Recovery
If customer records were created in wrong environment:
1. Compare databases to find missing customers
2. Review customer details in sync interface
3. Select customers for Production sync
4. Execute sync with confirmation

### 3. Note Migration
If important customer notes were added in Development:
1. Identify missing notes in comparison
2. Review note content and relevance
3. Select notes for Production migration
4. Sync notes to maintain customer history

## API Endpoints

### Development Environment Only
- `POST /api/dev/compare-databases` - Run database comparison
- `POST /api/dev/sync-to-production` - Execute selective sync

### Authentication Required
All endpoints require admin authentication and Development environment detection.

## Error Handling

### Common Errors
- **Database connection issues**: Check environment variables
- **SSL certificate problems**: Verify database SSL configuration
- **Permission errors**: Ensure admin role for user
- **Record not found**: May indicate concurrent changes

### Resolution Steps
1. Check server logs for detailed error messages
2. Verify database connectivity from both environments
3. Confirm user has admin privileges
4. Re-run comparison if records changed during process

## Best Practices

### Regular Monitoring
- Run weekly comparisons during development sprints
- Monitor for unexpected data divergence
- Keep Development in sync with Production when possible

### Data Hygiene
- Review Development data before syncing to Production
- Clean up test data in Development environment
- Document significant sync operations

### Security Practices
- Only sync verified, production-ready data
- Review all customer information before Production sync
- Maintain audit logs of sync operations
- Test sync operations with small batches first

## Troubleshooting

### Sync Failures
1. Check database connectivity for both environments
2. Verify record integrity and foreign key constraints
3. Review server logs for specific error details
4. Retry with smaller batches if bulk operations fail

### Performance Issues
1. Limit comparison scope for large datasets
2. Sync in smaller batches during off-peak hours
3. Monitor database connection limits
4. Use selective sync instead of bulk operations

### Data Conflicts
1. Production data always takes precedence
2. Use selective sync to avoid conflicts
3. Manually resolve duplicates before syncing
4. Consider data transformation if schema differs

## Support

For technical issues with the database sync system:
1. Check the server console logs for detailed error messages
2. Review the generated sync reports for diagnostic information
3. Use the Development Console's system status monitoring
4. Contact system administrator if database connectivity issues persist

---

**Remember**: Production is the source of truth. Never sync data to Production without careful review and explicit approval.