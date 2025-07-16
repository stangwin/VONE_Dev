# RULES OF ENGAGEMENT

This document defines how work will be executed, documented, automated, and maintained within the VONE CRM development environment. These guidelines are designed to enable consistent decision-making, reduce cognitive overhead, and maximize the effectiveness of both human and AI contributors.

---

## 1. 📐 Development Philosophy

- **Human Role**: Stan leads the project using clear English-based thinking, without writing low-level code unless necessary.
- **AI Role**: Assistants like ChatGPT, Claude, and Replit AI are responsible for interpreting English prompts into clean, professional code and documentation that adheres to these rules.
- **Foundation Rule**: "Make it simple, scalable, and clean — or don’t do it."
- **Build Intentional Software**: This CRM is a real product intended to support business-critical workflows. It is not a throwaway prototype.

---

## 2. 🧠 Prompting & Interaction Guidelines

When prompting any AI system:

- Always begin prompts with:  
  `Follow the RULES_OF_ENGAGEMENT.md for structure, naming, and interaction conventions.`
- Prefer declarative prompts in natural English.  
  > “Create a backend route that updates a customer’s status and logs the action with a timestamp.”
- AI should never assume context. If data is missing or ambiguous, it must respond:  
  > “Please confirm the structure or provide a reference example before I proceed.”
- All AI tools must prompt to update documentation (e.g. changelog, planning) after significant changes.

---

## 3. 🧪 Testing & Validation Rules

- **Automated testing** must:
  - Be executed prior to assuming success
  - Output a list of any **errors**, **warnings**, or **suspicious behavior**
  - Include **recommendations for fixes**
  - **Pause** for user review and approval before proceeding with any dependent steps
- AI tools must *not declare success* without verification and user acknowledgment.

---

## 4. 🚦Dev vs. Production Workflow

- **Development Environment**:  
  - Replit is the live development sandbox. All changes begin here.
  - `main` branch reflects active dev.
- **Production Environment**:
  - Defined as a *deployed, stable branch* or separate deployment target.
  - **Never** modify production directly.  
    → Production is *only updated by promoting tested dev changes.*
  - All production deployments must be deliberate, logged, and confirmed.
- **Collapse Warning**: Do not collapse environments prematurely unless guided by a clear workflow.

---

## 5. 📂 Repository Structure

- GitHub: `https://github.com/stangwin/VONE_Dev`
- Folder conventions:
  - `/docs/`: Human-readable project documents
  - `/components/`, `/routes/`, `/api/`: Structured by feature
  - Future: `/tests/`, `/scripts/`, `/migrations/`
- File naming: `snake_case` only for filenames and module exports.

---

## 6. 🔐 Secrets Management

- Secrets are stored in Replit’s **Secrets Manager**, not committed to Git.
- Never hard-code credentials into files.
- AI assistants must treat all environment variables or API keys as sensitive.
- Production credentials must be isolated from development ones.

---

## 7. 🛠 Automation & AI Tooling

- GitHub = version control authority.
- Replit = live preview and AI development.
- Claude may assist with deeper refactoring or UI input.
- All AI prompts should conform to this rules file.
- Output from AI must be:
  - Deterministic
  - Reviewable
  - Logged in the changelog
  - Respectful of the full app state

---

## 8. 🧾 Required Documentation

AI-generated or human-initiated code changes must update:

- `CHANGELOG.md`: Chronological summary of feature or refactor history
- `PLANNING.md`: Intent, backlog, roadmap, and architecture evolution
- `RULES_OF_ENGAGEMENT.md`: These operational policies

Missing updates will be treated as incomplete tasks.

---

## 9. ✅ Coding Hygiene

- Code must be clean, organized, and commented when non-obvious.
- Avoid giant monolithic files or duplicated logic.
- Common logic must be factored out into shared modules or services.
- Use `.gitignore` to prevent backup or debug artifacts from polluting the repo.

---

## 10. 🔄 Change Lifecycle & Promotion Policy

Every change must follow this sequence:

1. **Prompt Prepared**: Clear prompt defined, referencing these rules
2. **AI Responds**: Generates code, suggests doc updates
3. **Human Validates**: Stan approves logic, flow, and design
4. **Tests Run**: Errors surfaced, fixed, and retested
5. **Commit to Dev**: GitHub commit with clear message
6. **Docs Updated**: Changelog, Planning, etc.
7. **Staging (Optional)**: Optional environment before live
8. **Promote to Production**: Final stable deployment
9. **Confirm Success**: Final validation and test review

Production updates must **never be automatic**.

---

## 11. 🤝 Team Access & Ownership

- Stan is the only authorized user at this stage.
- All contributors or AI assistants must conform to these rules.
- AI tools are treated as assistants, not autonomous agents.

---

## 12. 📈 Future Enhancements

This document will evolve to include:

- CI/CD pipelines and version pinning
- Formal issue tracking and sprint boards
- User feedback loop capture
- Dependency and upgrade policy
- Release versioning rules

---

_Last updated: 2025-07-16_