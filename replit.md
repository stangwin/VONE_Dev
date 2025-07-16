# VONE CRM Application

## Overview

This is the VONE Customer Relationship Management (CRM) application built as a frontend-focused web application with a hybrid architecture. The application serves as a customer management system allowing users to track and manage customer information and interactions.

The current implementation uses a client-side localStorage database for data persistence, but includes infrastructure for migrating to a Postgres database with Drizzle ORM when needed.

## System Architecture

### Frontend Architecture
- **Technology**: Vanilla HTML, CSS, and JavaScript
- **Structure**: Single-page application (SPA) with view-based routing
- **Authentication**: Secure login/logout with session-based authentication
- **Components**: 
  - Modern dashboard with card-based customer listing
  - Add/Edit customer forms with dropdown validation
  - Auto-import functionality for Microsoft Lists data
  - Real-time duplicate detection and validation
  - User authentication with login/registration pages
- **Styling**: Custom CSS with CSS variables for theming and consistent design system

### Backend Architecture
- **Current**: Node.js/Express server with RESTful API endpoints
- **Authentication**: bcrypt password hashing with express-session and PostgreSQL session store
- **Database**: PostgreSQL (Neon) with Drizzle ORM for type-safe operations
- **API**: Full CRUD operations for customer management with authentication protection
- **Infrastructure**: Production-ready with proper error handling, validation, and security

### Data Storage
- **Database**: PostgreSQL with comprehensive customer and user schemas
- **ORM**: Drizzle ORM providing type safety and migrations
- **Schema**: 
  - Users table with bcrypt password hashing and future SSO support
  - Customers table with JSONB for flexible contact data and notes
  - Customer files table for file management and metadata
  - Session table for secure session management
- **ID Management**: Auto-incrementing primary keys plus custom customer IDs
- **Security**: Prepared for future SSO integration (Google, Microsoft) with flexible auth provider field

## Key Components

### Frontend Components
1. **CRMApp Class**: Main application controller managing state and view transitions
2. **SimpleDB Class**: localStorage abstraction providing database-like operations
3. **View System**: Dashboard and form views with dynamic content rendering
4. **Navigation**: Tab-based navigation between different application sections

### Database Layer
1. **SimpleDB**: Client-side storage wrapper with async API
2. **Drizzle Setup**: Pre-configured for Neon Postgres integration
3. **Schema**: Shared schema definitions ready for backend implementation

### Styling System
1. **CSS Variables**: Comprehensive design token system
2. **Status Colors**: Predefined color scheme for customer status indicators
3. **Responsive Design**: Mobile-first approach with flexible layouts

## Data Flow

1. **Application Initialization**: CRMApp loads existing customer data from localStorage
2. **Customer Management**: CRUD operations performed through SimpleDB interface
3. **View Updates**: Real-time DOM updates based on data changes
4. **Persistence**: All changes automatically saved to browser localStorage

## External Dependencies

### Current Dependencies
- **Python HTTP Server**: Simple static file serving for development
- **Browser APIs**: localStorage for data persistence

### Prepared Dependencies
- **Neon Database**: Serverless Postgres provider
- **Drizzle ORM**: Type-safe database operations
- **WebSocket Support**: For real-time database connections

## Deployment Strategy

### Current Deployment
- **Method**: Python HTTP server on port 5000
- **Environment**: Replit with Node.js and Python support
- **Configuration**: Simple static file serving

### Future Deployment Considerations
- Database migration from localStorage to Postgres
- Environment variable configuration for database connections
- Production-ready server implementation

## User Preferences

Preferred communication style: Simple, everyday language.
UI preferences: Minimal, compact interfaces - avoid large/obtrusive action buttons.
Change Management: Always ask permission before modifying production environment - formal change management process required.

## Deployment & Security Status

### Production Readiness
- ✅ Two-Factor Authentication (TOTP) implemented with QR code setup
- ✅ Strong password requirements enforced (8+ chars, uppercase, lowercase, numbers, special chars)
- ✅ Mobile-responsive design with touch-friendly interfaces
- ✅ Secure session management with PostgreSQL store
- ✅ Role-based access control (admin/user permissions)
- ✅ File upload system with validation and secure storage
- ✅ Ready for Replit Deployments with automatic HTTPS/TLS

### Recommended Deployment Method
**Replit Deployments** is the optimal choice for this project because:
- Seamless integration with existing Replit infrastructure
- Automatic HTTPS certificates and health monitoring
- Built-in scaling and reliability features
- Custom domain support available
- Zero-config deployment from current workspace

### Security Features Implemented
- bcrypt password hashing with salt rounds
- TOTP-based 2FA with speakeasy integration
- Session-based authentication with secure cookies
- Password strength validation on registration
- File type and size validation for uploads
- SQL injection protection with parameterized queries

## Complete 2FA Implementation Status

### User Interface
- ✅ Account Settings modal accessible from user dropdown
- ✅ Clean 2FA status display with Enable/Disable buttons
- ✅ Step-by-step 2FA setup with QR code and manual key
- ✅ Password verification before 2FA setup
- ✅ 6-digit code verification for enable/disable

### Admin Management
- ✅ 2FA status column in user management table
- ✅ Individual 2FA management per user
- ✅ Admin can force enable/disable 2FA for any user
- ✅ QR code generation for user setup

### Login Flow
- ✅ Enhanced login with 2FA code prompt when enabled
- ✅ Proper error handling for invalid codes
- ✅ Session management with 2FA verification

### Security Features
- ✅ TOTP-based authentication with speakeasy
- ✅ Password verification before 2FA changes
- ✅ Secure QR code generation and manual key backup
- ✅ Database storage of secrets and enabled status

## Environment Separation

### Production Environment
- **Status**: Default mode when no .env file exists - **FULLY OPERATIONAL**
- **Database**: Production PostgreSQL database via `DATABASE_URL` (public schema)
- **Session Management**: Dedicated `session_prod` table with iframe compatibility
- **Authentication**: Verified working - supports both cookie and session token authentication
- **UI**: Clean interface without development indicators
- **API Keys**: Production OpenAI and service integrations
- **Title**: "Vantix CRM"
- **Safety**: Protected from development modifications

### Development Environment (Schema-Based Isolation)
- **Setup**: Activated via .env file with `DATABASE_URL_DEV`
- **Visual Indicators**: Red banner "🚧 DEV ENVIRONMENT 🚧" and "[DEV]" in browser title
- **Database**: **SCHEMA ISOLATED** - Uses `vantix_dev` schema on same database
- **Configuration**: Uses .env file with test API keys and schema parameter
- **Data Isolation**: **COMPLETE SCHEMA SEPARATION** - Cannot access production schema
- **Environment Detection**: Automatic via `/api/environment` endpoint
- **Safety Features**: 
  - Schema-based isolation (`?schema=vantix_dev` parameter)
  - Automatic schema routing in database queries
  - URL validation with schema parameter checking
  - Environment switching scripts with validation

### Environment Management
- **Switch Scripts**: `./switch-to-production.sh` and `./switch-to-development.sh`
- **Status Check**: `./check-environment.sh` shows current configuration
- **Schema Isolation**: Single database with separate schemas for complete data isolation

## Database Synchronization System

### Core Principles
- **Production is the permanent source of truth**
- **No automatic sync operations - manual review required**
- **Development cannot overwrite Production without explicit approval**
- **All sync operations are additive only (no destructive operations)**
- **Comprehensive audit trail and error handling**

### Sync Tool Features
- **Automated Validation**: Continuous comparison until Dev matches Prod exactly
- **Schema-Aware Sync**: Handles column differences between environments
- **Retry Logic**: Up to 3 attempts with 2-second delays between validation cycles
- **Complete Table Replacement**: Truncates and rebuilds Dev tables from Prod source
- **Comprehensive Reporting**: Detailed sync reports with timestamps and status
- **Error Handling**: Graceful handling of missing tables and column mismatches

### Access Methods
- **Primary Tool**: `node production-dev-sync.js` - Automated prod-to-dev sync with validation
- **Legacy Tool**: `node dev-database-sync.js` - Manual comparison and selective sync
- **Web Interface**: Development Console at `/dev-console` → Database Comparison section

### Tables Monitored
- **customers**: Core customer records and company information
- **customer_files**: File attachments and media uploads  
- **customer_notes**: Customer interaction notes and history
- **users**: User accounts and authentication data

### Security Model
- **Authentication**: Admin role required for all sync operations
- **Environment Isolation**: Only available in Development environment
- **Data Validation**: Record integrity checks before sync
- **Audit Trail**: Complete logging of all sync operations

## Quick Action Sidebar

### Overview
The quick action sidebar provides rapid access to common CRM operations and real-time analytics, designed to streamline workflow efficiency and reduce click-through time for frequent tasks.

### Features
- **Customer Management**: Quick add, import, and export capabilities
- **Bulk Operations**: Mass status updates, next step assignments, and affiliate management  
- **Quick Navigation**: One-click filtering for leads, active customers, and pending actions
- **Real-time Analytics**: Live customer counts and status distribution
- **Responsive Design**: Collapsible sidebar with mobile-friendly behavior
- **Export Functionality**: CSV export with comprehensive customer data

### Usage
- Toggle sidebar with the arrow button in the header
- Use quick navigation buttons to filter customer views instantly
- Access bulk operations for managing multiple customers efficiently
- Monitor key metrics through the stats grid
- Export customer data directly to CSV format

## VONE v1.3 "Foundation & Flow" (Development Environment)

### Implementation Status: COMPLETED ✅
- **Affiliate Account Executive Field**: Added with real-time inline editing capabilities 
- **Enhanced Table Layout**: Next Step column repositioned beside Status for improved workflow
- **Database Schema Compatibility**: Production and development schemas synchronized 
- **Dual Environment Support**: Development (port 3000) and Production (port 5000) running simultaneously
- **Real-time Updates**: Account Executive changes save automatically with visual feedback

### Technical Implementation
- New `affiliate_account_executive` column added to customers table
- Inline editing input field with onChange event handling
- CSS styling with focus states and hover effects
- Form extraction updated to include Account Executive data
- Database sync compatibility restored between environments

### Access Information
- **Development**: Replit URL + ":3000" (shows red DEV banner)
- **Production**: Normal Replit URL (port 5000, clean interface)
- **Authentication**: test@test.com / test123 for development testing

## Changelog

**Note**: Changelog has been moved to `/docs/` folder. This section is deprecated.

Legacy changelog:
- July 14, 2025: **PRODUCTION NOTE** - Updated production AE data to match dashboard display (Rusty Betts, Neal Bontrager, Drake Druckenmiller) - monitor for issues
- July 14, 2025: **COMPLETED** - VONE v1.3 "Foundation & Flow" enhancements implemented in development environment
- July 14, 2025: Changed dashboard table header from "Account Exec" to "Affiliate AE" for accurate labeling
- July 14, 2025: Added Affiliate AE field to customer detail page with inline editing capability 
- July 14, 2025: Added "Follow with Affiliate AE" next step option for Lead status customers
- July 14, 2025: Implemented closure note enforcement modal requiring note before setting status to "Closed"
- July 14, 2025: Enhanced saveSectionChanges to include affiliate_account_executive field updates
- July 14, 2025: Added handleStatusChange function with modal popup for closure workflow
- July 14, 2025: **COMPLETED** - Fixed critical notes migration issue and development environment sync problems
- July 14, 2025: Migrated 11 legacy notes from old JSON format to proper customer_notes table in production
- July 14, 2025: Removed obsolete notes column from customers table to prevent future confusion
- July 14, 2025: Fixed sidebar layout overlap issue with proper spacing for header elements
- July 14, 2025: Resolved development environment database sync and file display issues
- July 14, 2025: Enhanced database sync tool with JSON parsing error handling
- July 14, 2025: Completed clean production→development data sync (14 customers, 53 notes, 5 files)
- July 12, 2025: **COMPLETED** - Updated system branding to VONE with tagline "One team. One system. Zero disruptions." across development environment
- July 12, 2025: **COMPLETED** - VONE v1.3 "Foundation & Flow" implemented exclusively in development environment
- July 12, 2025: Added Affiliate Account Executive field with inline editing and real-time updates
- July 12, 2025: Enhanced table layout positioning Next Step column beside Status field for improved workflow
- July 12, 2025: Fixed database schema synchronization between development and production environments
- July 12, 2025: Established stable dual environment system with simultaneous operation capabilities
- July 11, 2025: **COMPLETED** - Quick action sidebar implemented with comprehensive functionality
- July 11, 2025: Added sidebar with 4 sections: Customer Management, Bulk Operations, Quick Navigation, and Quick Stats
- July 11, 2025: Implemented bulk status updates, next step management, and affiliate assignment with filtering
- July 11, 2025: Added CSV export functionality with complete customer data extraction
- July 11, 2025: Built responsive design with collapsible sidebar and mobile-friendly behavior
- July 11, 2025: Enhanced with real-time analytics showing customer counts and status distribution
- July 11, 2025: **COMPLETED** - Fixed critical "String did not match the expected pattern" file upload error
- July 11, 2025: Resolved double /api/ URL prefix issue in DatabaseAPI class causing system note creation failures
- July 11, 2025: Simplified baseURL construction from '/api' to '' and fixed all endpoint URL building logic 
- July 11, 2025: Updated all fetch calls to use consistent '/api/...' pattern throughout DatabaseAPI methods
- July 11, 2025: Fixed file size limit mismatch between frontend (50MB) and backend (5MB)
- July 11, 2025: Updated backend file validation to enforce 50MB limit consistently with frontend UI display
- July 11, 2025: Added HEIC/HEIF image format support (.heic, .heif) to allowed file extensions
- July 11, 2025: Fixed formidable maxFileSize configuration from 100MB to 50MB to match user expectations
- July 11, 2025: Standardized error message to "File must be less than 50MB" across frontend and backend
- July 11, 2025: Updated file input accept attribute to include .heic,.heif for Apple device compatibility
- July 10, 2025: **COMPLETED** - Fixed critical customer form submission bug preventing Save Customer functionality
- July 10, 2025: Identified missing event listener in bindEvents() method - customer form submit was never bound to handleSaveCustomer()
- July 10, 2025: Added proper form submission event binding with console logging for debugging customer creation flow
- July 10, 2025: Verified authentication working correctly (userId: 6, Stan@vantix.tech) and API endpoints accessible
- July 10, 2025: **COMPLETED** - Production environment authentication issue resolved - login working perfectly
- July 10, 2025: Fixed session persistence by creating dedicated session_prod table for production environment
- July 10, 2025: Added iframe session token support for both development and production environments
- July 10, 2025: Enhanced session middleware with proper table routing and cookie compatibility settings
- July 10, 2025: Verified complete authentication flow - user Stan@vantix.tech successfully accessing production data
- July 10, 2025: **COMPLETED** - Environment switching scripts implemented with schema-based isolation validation
- July 10, 2025: Created switch-to-production.sh and switch-to-development.sh for easy environment management
- July 10, 2025: Added check-environment.sh script for instant environment status verification
- July 10, 2025: Updated database sync tool to support schema-based isolation with proper query routing
- July 10, 2025: Created comprehensive ENVIRONMENT_GUIDE.md with troubleshooting and best practices
- July 10, 2025: **COMPLETED** - Schema-based database isolation verified working with test development customer
- July 10, 2025: Production environment (public schema): 12 customers, 53 files, 9 notes, 3 users intact
- July 10, 2025: Development environment (vantix_dev schema): 1 test customer isolated from production
- July 10, 2025: Database sync tool updated to handle schema isolation with proper Production→Dev sync capabilities
- July 5, 2025: **COMPLETED** - Comprehensive database synchronization system implemented with Production as permanent source of truth
- July 5, 2025: Added database comparison tool to identify differences between Dev and Production environments
- July 5, 2025: Created selective sync interface with manual review and explicit approval required for Production changes
- July 5, 2025: Implemented safety safeguards: no automatic sync, confirmation dialogs, audit trails, and rollback capabilities
- July 5, 2025: Built web interface in Development Console for easy access to comparison and sync tools
- July 5, 2025: Added comprehensive documentation in DATABASE_SYNC_GUIDE.md and updated replit.md architecture section
- July 5, 2025: **COMPLETED** - Development environment fully restored and verified working in browser tabs
- July 5, 2025: Fixed database connection issues by resolving environment variable expansion and session table conflicts
- July 5, 2025: Cleared and recreated session table to resolve primary key constraint conflicts
- July 5, 2025: Verified authentication working with test@test.com/test123 and dev session token generation for iframe contexts
- July 5, 2025: Development environment now shows proper indicators: red DEV banner, [DEV] title prefix, debug dropdown, and /dev-console access
- July 5, 2025: **COMPLETED** - Fixed file upload functionality in production environment by adding missing authentication credentials
- July 5, 2025: Resolved "Uploading..." infinite loading issue by including 'credentials: include' in upload fetch requests
- July 5, 2025: Fixed double /api/ URL construction bug in createSystemNote method preventing proper system note creation
- July 5, 2025: Verified complete upload flow - successfully processed 16 HEIC files for customer_011 with proper database storage
- July 5, 2025: Confirmed upload directories exist and are writable, formidable middleware active and processing files correctly
- July 4, 2025: **COMPLETED** - Fixed file attachment indicator system debugging and resolved URL construction issues
- July 4, 2025: Identified and fixed double /api/ URL construction bug in file counts API
- July 4, 2025: Verified file counts API working correctly - customer_001 (My Pharmacist On Call) and customer_007 (Sadler Hughes Apothecary) each have 10 files
- July 4, 2025: Enhanced authentication flow and error handling for file counts loading
- July 4, 2025: Added proper debugging logs for file attachment indicator functionality
- July 2, 2025: **COMPLETED** - Session/cookie handling debugged and fixed for dev environment iframe contexts
- July 2, 2025: Implemented development session token system for iframe authentication (cookies blocked in preview tab)
- July 2, 2025: Enhanced CORS headers and session isolation between dev/prod environments
- July 2, 2025: Added comprehensive session debugging and authentication flow logging
- July 2, 2025: **COMPLETED** - Full Dev/Prod environment separation and workflow support implementation
- July 2, 2025: Added startup selector (startup.js) for choosing environment mode with interactive CLI
- July 2, 2025: Created development console at /dev-console with system monitoring and database tools
- July 2, 2025: Implemented database statistics dashboard, sample data loader, and changelog editor
- July 2, 2025: Added version management system with version.json and switching interface
- July 2, 2025: Enhanced production security - debug dropdown and dev tools hidden in production mode
- July 2, 2025: Added comprehensive dev API endpoints protected by environment checks
- July 2, 2025: **COMPLETED** - Implemented full database isolation between development and production environments with safety safeguards
- July 2, 2025: Added DATABASE_URL_DEV and DATABASE_URL_PROD environment variables for complete database separation
- July 2, 2025: Enhanced server startup with safety checks preventing cross-environment database contamination
- July 2, 2025: Development mode now requires DATABASE_URL_DEV and cannot access production database URLs
- July 2, 2025: Added /api/database-status endpoint for monitoring database isolation status
- June 30, 2025: **COMPLETED** - Implemented Prod/Dev environment separation with visual indicators and isolated configuration
- June 30, 2025: Added development environment detection via .env file and /api/environment endpoint
- June 30, 2025: Created .env.example template and DEV_SETUP.md guide for cloned development environments
- June 30, 2025: Added development UI indicators (red banner, [DEV] title) shown only in development mode
- June 30, 2025: Production environment remains completely unchanged while dev clone shows clear development indicators
- June 28, 2025: **COMPLETED** - OpenAI GPT-4o auto-fill system fully functional with comprehensive field population
- June 28, 2025: Enhanced field mapping system with detailed debugging and proper event triggering for form validation
- June 28, 2025: AI successfully extracts and populates: company details, primary contact, authorized signer, billing contact, and detailed notes
- June 28, 2025: Added test mode toggle to prevent saving test data during debugging; intelligent business context capture in notes
- June 27, 2025: **COMPLETED** - Implemented OpenAI GPT-4o integration for intelligent text parsing in customer creation form
- June 27, 2025: Added /api/parse-text endpoint with authentication and comprehensive prompt engineering for CRM data extraction
- June 27, 2025: Updated Quick Fill from Text feature to use AI instead of regex parsing with loading indicators and error handling
- June 27, 2025: Raw GPT responses logged to console for debugging; form auto-populates with extracted customer data including company info, contacts, services, and urgency levels
- June 26, 2025: **COMPLETED** - Added comprehensive video file support (.mp4, .mov, .avi, .webm, etc.) to Files & Media system
- June 26, 2025: Enhanced file upload with 100MB limit for videos, HTML5 video player modal preview, and video file icons
- June 26, 2025: Fixed note creation functionality - notes are successfully saved to database but require authentication to view
- June 26, 2025: Enhanced login instructions with test credentials prominently displayed for iframe users
- June 26, 2025: **COMPLETED** - Enhanced image zoom/pan system with professional-grade functionality matching Google Photos/Apple Photos
- June 26, 2025: Implemented smooth 2D panning with proper bounds checking and cursor management (grab/grabbing states)
- June 26, 2025: Added touch support for mobile with two-finger pinch zoom and single-finger pan gestures
- June 26, 2025: Enhanced zoom behavior with zoom-to-point functionality and fluid transform animations
- June 26, 2025: **COMPLETED** - Added zoom functionality to image modal popups with zoom in/out controls, mouse wheel zoom, and pan capability
- June 26, 2025: Improved zoom controls layout - moved to bottom left with better spacing and semi-transparent background overlay
- June 26, 2025: Implemented zoom controls (buttons, percentage display, reset) and mouse interactions (wheel zoom, double-click reset, drag to pan)
- June 26, 2025: **COMPLETED** - Implemented individual section editing with edit icons (✏️) replacing page-wide edit mode
- June 26, 2025: Changed customer detail page from single "Edit Page" button to section-specific edit icons with independent save/cancel
- June 26, 2025: Restricted picture deletion to edit mode only - delete buttons now only appear when Files section is being edited
- June 26, 2025: Added user profile dropdown with avatar, logout, and "Manage Users" link for admins in header
- June 26, 2025: Created comprehensive user management interface at /users.html with CRUD operations for admin users
- June 26, 2025: **COMPLETED** - Implemented comprehensive multi-user authentication system with secure login/logout
- June 26, 2025: Added bcrypt password hashing, express-session with PostgreSQL session store, and authentication middleware
- June 26, 2025: Created user registration/login pages with modern UI and proper error handling
- June 26, 2025: Protected all API endpoints with authentication - requires login to access CRM functionality
- June 26, 2025: Added user management database schema prepared for future SSO integration (Google, Microsoft)
- June 26, 2025: Implemented secure session management with proper credential handling and CORS configuration
- June 26, 2025: **COMPLETED** - Fully debugged and resolved Files & Media system with working file deletion and customer data integrity
- June 26, 2025: Fixed critical server route ordering issue preventing proper file deletion API calls
- June 26, 2025: Resolved file upload completion bugs and increased file size limits to 50MB total capacity
- June 26, 2025: Implemented working individual file deletion with confirmation dialogs and proper database cleanup
- June 26, 2025: Added comprehensive error logging and route pattern matching to prevent accidental customer deletions
- June 25, 2025: Implemented comprehensive Files & Media section with complete file upload/management functionality
- June 25, 2025: Added customer_files database table with PostgreSQL backend for file metadata storage
- June 25, 2025: Built drag-and-drop file upload interface with image thumbnails and PDF support
- June 25, 2025: Created file modal viewer with download capability and delete functionality in edit mode
- June 25, 2025: Added file validation (5MB limit, images/PDFs only) and secure file handling
- June 25, 2025: Implemented modern file grid layout with hover effects and professional styling
- June 25, 2025: Rebranded application as "Vantix CRM" with updated title and professional typography
- June 24, 2025: Enhanced customer detail page with full edit mode, modern styling, and interactive notes section
- June 24, 2025: Added comprehensive editing for all customer fields with save/cancel functionality
- June 24, 2025: Implemented chronological notes display with add note capability and database persistence
- June 24, 2025: Applied professional UI styling with consistent spacing, hover states, and button designs
- June 24, 2025: Redesigned frontend with HubSpot-inspired table layout and customer detail pages
- June 24, 2025: Added inline editing for Status and Next Step fields with real-time API updates
- June 24, 2025: Implemented table sorting, filtering by status/affiliate/search, and Next Actions section
- June 24, 2025: Created modern customer detail view with tabbed sections for contacts, notes, and actions
- June 24, 2025: Identified Replit iframe rendering issue - CRM works perfectly in new tabs/mobile but not in embedded preview
- June 24, 2025: Added comprehensive debug logging and environment detection for iframe/CORS issues  
- June 24, 2025: Successfully migrated from localStorage to PostgreSQL database - 12 customers now stored persistently 
- June 24, 2025: Implemented Node.js server with RESTful API endpoints for full CRUD operations
- June 24, 2025: Fixed frontend-backend integration - dashboard now correctly displays all customers from database
- June 24, 2025: Prepared OpenAI integration for intelligent email/text parsing (awaiting API key)
- June 24, 2025: Enhanced auto-fill functionality with graceful fallback to regex parsing
- June 24, 2025: Added automatic customer ID generation with sequential numbering (customer_001, customer_002, etc.)
- June 24, 2025: Implemented auto-import of Microsoft Lists data on first load - no manual import needed
- June 23, 2025: Updated form fields to use dropdowns for data consistency (Status, Affiliate Partner, Next Step)
- June 23, 2025: One-time import of Microsoft Lists customer data - 12 customers imported directly
- June 20, 2025: Enhanced CRM with modern dashboard layout showing company name, status, affiliate partner, next step, and latest notes
- June 20, 2025: Added quick action buttons for View Details, Create in QBO, and Send Agreement
- June 20, 2025: Improved card-based grid layout with better information density
- June 20, 2025: Added affiliate partner and next step fields to customer forms
- June 20, 2025: Prepared PostgreSQL database integration structure
- June 20, 2025: Added integration stubs for OpenAI, QuickBooks, and DocuSign APIs
- June 20, 2025: Initial setup