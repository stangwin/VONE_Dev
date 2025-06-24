# Simple CRM Application

## Overview

This is a simple Customer Relationship Management (CRM) application built as a frontend-focused web application with a hybrid architecture. The application serves as a customer management system allowing users to track and manage customer information and interactions.

The current implementation uses a client-side localStorage database for data persistence, but includes infrastructure for migrating to a Postgres database with Drizzle ORM when needed.

## System Architecture

### Frontend Architecture
- **Technology**: Vanilla HTML, CSS, and JavaScript
- **Structure**: Single-page application (SPA) with view-based routing
- **Components**: 
  - Modern dashboard with card-based customer listing
  - Add/Edit customer forms with dropdown validation
  - Auto-import functionality for Microsoft Lists data
  - Real-time duplicate detection and validation
- **Styling**: Custom CSS with CSS variables for theming and consistent design system

### Backend Architecture
- **Current**: Static file serving using Python's built-in HTTP server
- **Future**: TypeScript backend with Drizzle ORM integration ready
- **Database**: Currently localStorage with auto-import, with Neon Postgres infrastructure prepared

### Data Storage
- **Current Solution**: Browser localStorage with automatic customer ID generation (customer_001, customer_002, etc.)
- **Auto-Import**: Microsoft Lists data automatically loads on first visit
- **Future Solution**: Neon Postgres database with Drizzle ORM for multi-device sync
- **ID Management**: Sequential customer numbering with automatic collision detection

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

## Changelog

Changelog:
- June 24, 2025: Added automatic customer ID generation with sequential numbering (customer_001, customer_002, etc.)
- June 24, 2025: Implemented auto-import of Microsoft Lists data on first load - no manual import needed
- June 24, 2025: Fixed CRM data loading and auto-import functionality - customers now display properly on dashboard
- June 23, 2025: Updated form fields to use dropdowns for data consistency (Status, Affiliate Partner, Next Step)
- June 23, 2025: One-time import of Microsoft Lists customer data - 12 customers imported directly
- June 20, 2025: Enhanced CRM with modern dashboard layout showing company name, status, affiliate partner, next step, and latest notes
- June 20, 2025: Added quick action buttons for View Details, Create in QBO, and Send Agreement
- June 20, 2025: Improved card-based grid layout with better information density
- June 20, 2025: Added affiliate partner and next step fields to customer forms
- June 20, 2025: Prepared PostgreSQL database integration structure
- June 20, 2025: Added integration stubs for OpenAI, QuickBooks, and DocuSign APIs
- June 20, 2025: Initial setup