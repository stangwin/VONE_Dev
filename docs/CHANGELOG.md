# CHANGELOG

This document records key changes made to the CRM project from its inception. Each entry includes dates (where known), a brief summary of changes, and notes about relevant improvements, bug fixes, or major process updates.

---
Version 1.2 - Environment Separation (2025-07-02)

New Features

✅ Complete Dev/Prod environment separation with database isolation
✅ Startup selector for choosing environment mode
✅ Development console with system monitoring and database tools
✅ Sample data loading for development testing
✅ Environment-specific UI indicators (banners, debug tools)
✅ Version management system with changelog editor
Security Enhancements

✅ Database isolation safeguards prevent cross-environment contamination
✅ Production mode blocks all development endpoints and tools
✅ Environment detection with fail-safe defaults
Developer Tools

✅ Dev console at /dev-console (development only)
✅ Database statistics dashboard
✅ Sample data generator with 3 test customers
✅ Live changelog editor with markdown preview
✅ Version switching interface (framework ready)
Version 1.1 - System Notes + Test Mode (2025-06-27)

New Features

✅ System-generated activity notes
✅ Test mode toggle for safe development
✅ OpenAI GPT-4o integration for intelligent text parsing
✅ Enhanced two-factor authentication system
✅ Video file support in Files & Media system
UI Improvements

✅ Professional image zoom/pan functionality
✅ Individual section editing with save/cancel
✅ User management interface for administrators
Version 1.0 - MVP (2025-06-20)



## July 2025

### July 1–8, 2025
- **Initial CRM Concept & Replit Setup**
  - Defined purpose: lightweight CRM for internal tracking and customer onboarding.
  - Chose Replit as the development environment.
  - Initialized Git repo and structured basic app layout.

### July 9, 2025
- **Session Authentication and Basic Views**
  - Login system added.
  - Session handling implemented with dev and prod database support.
  - CRM authenticated via session token on load.

### July 10–11, 2025
- **Customer Object Schema and Database Table Setup**
  - Defined `customers` table.
  - Added support for contact info JSON in primary/authorized/billing fields.
  - CRUD routes for customers initiated.

### July 12–13, 2025
- **Front-End CRUD Interface**
  - Created customer list view.
  - Added modal forms for add/edit customer.
  - Hooked up front-end API calls for list/add/edit operations.

### July 14, 2025
- **Delete Customer Flow (Initial Attempt)**
  - Added delete button in UI.
  - Created `/api/customers/:id` DELETE route.
  - Bug discovered: event listener bound to undefined `window.app.api.deleteCustomer`.

### July 15, 2025
- **Critical Fix: window.app properly defined**
  - Changed app initialization to `window.app = new CRMApp()` to expose `api` object globally.
  - Rewrote delete logic with:
    - Async/await handling
    - Debug steps A–O for tracing delete calls
    - Error handling and customer list refresh

- **Connected to GitHub**
  - Created GitHub repo: `VONE_Dev`
  - Pushed project (after removing large `.tar.gz` backup file)
  - Updated `.gitignore` to avoid large file inclusion in future.

- **Documentation Phase Begins**
  - Created `/docs/PLANNING.md`, `/docs/CHANGELOG.md`, `/docs/RULES_OF_ENGAGEMENT.md`
  - Committed and pushed documentation stubs.
  - Began formalizing project records and vision.

---

## Future Changes (Planned)
See `PLANNING.md` for full roadmap.

- Add customer status tracking and filters
- Implement visual dashboards
- Build lightweight ticketing integration
- Add user access levels
- Sync contacts with other tools (optional)
- ## [2025-07-16] Full Codebase Sweep & Planning Overhaul

- Completed comprehensive manual audit of frontend and backend code
- Identified and documented front-end design debt, logic sprawl, missing validation, and unnecessary global variables
- Created unified cleanup sprint plan inside `PLANNING.md`
- Rewrote `PLANNING.md` and `RULES_OF_ENGAGEMENT.md` for clarity, accuracy, and project scalability
- Confirmed current development environment is viable for both dev and production pending future separation
- ### 2025-07-16 — Full Codebase Assessment + Planning Sprint

- Completed full sweep of frontend/backend source code
- Identified key issues: UI design debt, client-side logic misuse, missing validation
- Created Sprint 1: Codebase Cleanup and Sprint 2: UI Design & Layout Refinement
- Added Google Stitch evaluation as a guide for UI best practices
- Rewrote PLANNING.md and RULES_OF_ENGAGEMENT.md to reflect current scope, sprints, and workflows
