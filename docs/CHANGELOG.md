# CHANGELOG

This document records key changes made to the CRM project from its inception. Each entry includes dates (where known), a brief summary of changes, and notes about relevant improvements, bug fixes, or major process updates.

---

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