# RULES OF ENGAGEMENT

This document defines how work will be executed, documented, automated, and maintained within the VONE CRM development environment. These guidelines are designed to enable consistent decision-making, reduce cognitive overhead, and maximize the effectiveness of both human and AI contributors.

---

## 1. 📐 Development Philosophy

- **Human Role**: Stan leads the project using clear English-based thinking, without writing low-level code unless necessary.
- **AI Role**: Assistants like ChatGPT and Replit AI are responsible for interpreting English prompts into clean, professional code and documentation that adhere to these rules.
- **Foundation Rule**: "Make it simple, scalable, and clean — or don’t do it."

---

## 2. 🧠 AI Prompting Rules

When interacting with AI agents (ChatGPT, Replit AI, Claude, etc.):

- Refer to this file by stating:  
  `Follow the RULES_OF_ENGAGEMENT.md for structure, naming, and interaction conventions.`
- Prefer **English-first prompts** like:  
  > “Build a function that deletes a customer and logs all API debug steps A–O.”
- Avoid restating previously shared context — AI tools should retain and build on prior chat history unless specifically reset.
- Prioritize **automated documentation** with every code or architecture change. If unclear, AI should prompt:  
  > “Should I append this to the changelog or update the roadmap?”

---

## 3. 🚦Development vs Production Workflow

- **Replit Dev Environment**:
  - Used for all development and testing.
  - Commits reflect experimental or incremental progress.
  - `main` branch = active development.
- **Production Environment**:
  - Will be created as a deployed, stable branch or external deployment.
  - No changes are made here directly — production is *only* updated via promotion from tested dev code.
  - Deployment should freeze the code and isolate it from development mutations.

---

## 4. 📁 Repository Standards

- GitHub repo: `https://github.com/stangwin/VONE_Dev`
- Every commit that changes logic, data models, or flow must:
  - Update the relevant documentation in `/docs/`
  - Include a changelog entry (summarized, dated)
  - Follow standard commit messages:  
    Example: `Add deleteCustomer() API and bind to trash icon`

---

## 5. 📄 File & Directory Naming

- Use lowercase with underscores (`snake_case`) for filenames.
- Reserve `/docs/` for human-readable Markdown.
- Future folders may include `/tests/`, `/scripts/`, or `/migrations/` as the app matures.

---

## 6. 🛠 Automation & Tools

- GitHub is the source of truth for version control and collaboration.
- Replit is the primary interactive development and preview platform.
- Tools like Claude may assist in deep code analysis if needed, but all source remains on GitHub.
- Avoid using Git LFS unless critical; exclude large backups and binaries.

---

## 7. 🧾 Documentation Automation Expectations

- Documentation files will be:
  - `CHANGELOG.md`: Running log of major updates (structured chronologically)
  - `PLANNING.md`: High-level roadmap and architecture goals
  - `RULES_OF_ENGAGEMENT.md`: Operational governance (this file)
- AI tools should generate documentation automatically **in response to prompts**, without requiring redundant context input from Stan.
- AI assistants should always prompt to update documentation after key changes.

---

## 8. ✅ Style, Review & Commit Hygiene

- All code should be clean, readable, and commented when non-obvious.
- Do not include temporary debug files or backup archives in Git.
- Use `.gitignore` to manage exclusions.
- For larger changes, always include a summary of:
  - What changed
  - Why it changed
  - Where it impacts downstream logic

---

## 9. 🤝 Team & Access Control

- Single developer/owner at present (Stan).
- Additional contributors must follow these rules.
- Any automation or AI-generated output must be reviewable, editable, and reversible.

---

## 10. 🔒 Security

- Credentials, tokens, and session logic should always be environment-specific.
- Production config values must be separated from development settings.
- No real credentials should ever be committed to GitHub.

---

## 11. 🚧 Future Enhancements

As the CRM evolves, this document will expand to include:

- CI/CD pipelines
- Multi-environment deployment processes
- Test coverage expectations
- Issue tracking policies

---

> 📎 Last updated: July 15, 2025