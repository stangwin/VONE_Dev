# Vantix CRM Application

## Overview

This is the Vantix Customer Relationship Management (CRM) application built as a frontend-focused web application with a hybrid architecture. The application serves as a customer management system allowing users to track and manage customer information and interactions.

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

### Production Environment (Current)
- **Status**: Fully functional and unchanged
- **Database**: Production PostgreSQL database via `DATABASE_URL_PROD` or `DATABASE_URL`
- **UI**: Clean interface without development indicators
- **API Keys**: Production OpenAI and service integrations
- **Title**: "Vantix CRM"
- **Safety**: Cannot access development database URLs

### Development Environment (Clone Setup)
- **Setup**: Created via .env.example and DEV_SETUP.md guide
- **Visual Indicators**: Red banner "🚧 DEV ENVIRONMENT 🚧" and "[DEV]" in browser title
- **Database**: **COMPLETELY ISOLATED** - Uses only `DATABASE_URL_DEV`
- **Configuration**: Uses .env file with test API keys
- **Data Isolation**: **FULL DATABASE ISOLATION** - Cannot access production database
- **Environment Detection**: Automatic via `/api/environment` endpoint
- **Safety Features**: 
  - Requires `DATABASE_URL_DEV` or server exits
  - Prevents accidental production database access
  - URL validation blocks cross-environment contamination

## Changelog

Changelog:
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