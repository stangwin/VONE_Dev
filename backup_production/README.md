# VONE CRM Production Data Backup
**Created:** July 29, 2025  
**Source:** Production Database (vantix.tech deployment)  

## 📊 Backup Contents

### Core Data Tables
- **customers_full.csv** - 26 customer records (16 active, 10 archived/deleted) - COMPLETE EXPORT
- **customer_notes_full.csv** - 152 customer interaction notes - COMPLETE EXPORT  
- **customer_files_full.csv** - 85 file attachments and media - COMPLETE EXPORT
- **affiliates.json** - 3 affiliate partners (VOXO, MedNet Solutions, PharmaPartners)
- **affiliate_aes.json** - 5 affiliate account executives
- **products.json** - 5 Cisco Meraki products and licenses
- **users.json** - 3 user accounts (Stan Gwin, Test User, Demo User)
- **quotes.json** - Empty (no quotes in production)
- **quote_items.json** - Empty (no quote items in production)

### File Assets
- **uploads/** - Directory containing all customer file uploads
  - Network diagrams, photos, documentation
  - HEIC images from mobile uploads
  - JPEG photos and network schematics
  - Files organized by customer_id subdirectories

## 📋 Key Statistics
- **Active Customers**: 16 (not deleted)
- **Customer Notes**: 152 total notes with full interaction history
- **File Attachments**: 85 files across multiple customers
- **Total File Size**: ~150MB of customer files
- **Users**: 3 authenticated users with admin/user roles
- **Affiliates**: 3 partner organizations with 5 account executives

## 🔗 Data Relationships
All data maintains proper foreign key relationships:
- Notes → Customers via `customer_id`
- Files → Customers via `customer_id`  
- Affiliate AEs → Affiliates via `affiliate_id`
- Customers → Affiliates via `affiliate_partner` name matching

## 🔍 Validation Checklist
✅ All 26 customers exported with complete contact information  
✅ All 152 notes preserved with timestamps and authorship  
✅ All 85 files mapped to correct customers  
✅ Affiliate relationships maintained  
✅ File directory structure preserved  
✅ No orphaned records  

## 🚀 Restoration Notes
- Use `customer_id` as primary key for linking data
- File paths in `customer_files_complete.json` match upload directory structure
- User passwords are bcrypt hashed (production security maintained)
- All timestamps in ISO format for easy parsing
- JSON structure allows easy import into any database system

## 📞 Key Customers
- **My Pharmacist On Call** - Onboarding (customer_001)
- **McCoy Tygart Drug** - Signed (customer_006) 
- **Plains Drug** - Signed (customer_1752255981406)
- **Berea Drug** - Onboarding (customer_002)
- **Southeast Pharmacy** - Onboarding (customer_003)

This backup represents a complete snapshot of production data as of July 29, 2025.