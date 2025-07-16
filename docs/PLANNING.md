# VONE CRM — PLANNING DOCUMENT

## 📌 Origin & Purpose

VONE CRM began as a lightweight, customized customer relationship manager for managing early-stage MSP client engagements. It was intended to:

- Replace chaotic spreadsheets and text threads
- Support deal flow, onboarding, and service management
- Provide simple UI with fast backend responses
- Be easily extensible by a non-deep-code founder with AI assistance

The project is also a testbed for building software "in plain English" — where business logic, process clarity, and automation matter more than deep syntax or engineering complexity.

---

## 🧠 Foundational Design Principles

- **Speak English, not JSON** – Business owners should describe workflows in natural language and have AI do the rest.
- **Declarative Rules of Engagement** – Reusable AI prompt rules govern how tools behave when implementing changes.
- **Professional Documentation** – Planning, changelogs, and engagement rules are embedded in the repo for reference by humans and AI tools alike.
- **No-Code / Low-Code Mentality** – We prefer generating, modifying, and managing code using prompt-based development wherever feasible.
- **Production-Ready UX** – This is not a hobby app. Every UI, even in early stages, should function reliably and professionally.

---

## ✅ Milestones Completed

| Date       | Milestone Description                                                                 |
|------------|-----------------------------------------------------------------------------------------|
| 2025-06    | Initial data model designed (customers, contacts, etc.)                               |
| 2025-06    | Basic CRUD functionality for customers implemented                                     |
| 2025-06    | Replit environment configured for production and development                          |
| 2025-07-01 | Global authentication added with session token handling                               |
| 2025-07-05 | Customer DELETE functionality debugged and implemented with full async logging         |
| 2025-07-12 | GitHub repo created; production history ported into Git; oversized backup removed      |
| 2025-07-15 | Planning, Changelog, and Rules of Engagement documents scaffolded and tracked in Git  |
| 2025-07-16 | Full codebase analysis completed — red flags and next sprint defined                  |

---

## 🔄 Active Workstreams

1. **Documentation Automation**
   - Keep CHANGELOG, PLANNING, and RULES_OF_ENGAGEMENT in sync with project state
   - Enable AI agents to self-update docs when commits or features change

2. **Customer Management Enhancements**
   - Expand CRUD support for contacts, billing info, and notes
   - Add ability to archive, tag, or assign owners to customers

3. **Quote & Agreement Automation**
   - Trigger DocuSign flows directly from VONE with customer-specific data
   - Log quotes and agreements in system for audit trail

4. **Dashboard + Analytics**
   - Add summary views for sales pipeline, support status, account stage
   - Include timeline view for customer activity history

---

## 🔁 Sprint Plan

### 🏁 Sprint 1 — Codebase Cleanup (2025-07-17 through 2025-07-20)

- [ ] Refactor repeated route logic into shared controller structure
- [ ] Move client-side logic (e.g. customer deletion) to backend
- [ ] Enforce consistent form validation on all fields
- [ ] Replace any remaining inline scripts with modular handlers
- [ ] Confirm secret handling via Replit Secrets Manager

### 🎯 Sprint 2 — UI Design & Layout Refinement (2025-07-21 through 2025-07-24)

- [ ] Evaluate dashboard spacing and padding across screen sizes
- [ ] Shrink table columns for `Files` and `Phone` (prevent line wrap)
- [ ] Replace `Other`/custom dropdown option with smarter UI logic
- [ ] Collapse or reposition filters/search bar for space efficiency
- [ ] Use Google Stitch (Material 3) to evaluate and modernize layout

---

## 📥 Backlog (Next Priorities)

- ☐ Implement contact sub-record management (linked to customer)
- ☐ Add user role support (admin, sales, support)
- ☐ Enable filtering and searching in customer table
- ☐ Export customer data to CSV or PDF
- ☐ Simplified UI refresh using Tailwind CSS or similar
- ☐ Replace ad hoc email notifications with templated communications

---

## 🚀 Future Ideas

- 🧠 GPT-powered insight panel ("What actions should I take next for this customer?")
- 📁 Document storage per customer (proposal files, agreements)
- 🔁 Integration with support system (Freshdesk or custom)
- 📅 Scheduling module for follow-ups and onboarding tasks
- 🔐 MFA and audit logs for compliance-ready deployments

---

## 📎 Constraints & Non-Goals

- Not designed as a full CRM competitor (e.g., Salesforce)
- No mobile app planned at this time
- No 3rd-party integrations until core flows are stable

---

## 🤖 Prompt-Based Development Philosophy

> **“The code is not the product. The experience is the product.”**

This CRM is being built with a prompt-first development strategy. The intent is not to become a full-stack coder, but to manage product vision, guide AI-based development, and validate outcomes.

To support this, the project includes:

- `docs/RULES_OF_ENGAGEMENT.md` — defines how AI should respond to prompts
- `docs/CHANGELOG.md` — defines what has changed and when
- `docs/PLANNING.md` — defines what we’re doing and why

AI tooling (Replit, ChatGPT, Claude, etc.) should always refer to these documents before executing code changes.

---

_Last updated: 2025-07-16_