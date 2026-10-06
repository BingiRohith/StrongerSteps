# Next Chat Prompt

Copy the prompt below into a new Codex chat for the next StrongerSteps sprint. Replace the bracketed sprint goal before sending it.

```text
Continue the StrongerSteps project from the latest origin/main branch.

Workspace/repository:
- Local project: C:\Users\rosha\OneDrive\Desktop\StrongerSteps
- GitHub: https://github.com/BingiRohith/StrongerSteps
- Branch: main

SPRINT GOAL:
[Describe the one sprint outcome here. Recommended next candidate: design and build the reusable Media Library described in CRS §15/§18.]

Before editing:
1. Read docs/01_PROJECT_HANDOVER.md, docs/CURRENT_HANDOVER.md,
   docs/15_SPRINT_CONTINUATION_WORKFLOW.md, docs/02_ROADMAP.md, and the
   technical docs relevant to this sprint.
2. Inspect git status and the latest commit. Preserve all existing work.
3. Inspect the actual code before trusting older notes.
4. Use the existing .env.local without printing its values. Never expose or
   commit MongoDB, JWT, admin-password, or OTP secrets.
5. Preserve the existing MongoDB Atlas database. Do not reset, delete, reseed,
   or migrate data unless the sprint explicitly requires it and the user has
   authorized that impact.

Working style:
- Continue autonomously through implementation and appropriate verification.
- Explain each meaningful change clearly in progress updates: what changes,
  why, database impact, and how it will be tested.
- Add concise code comments for security, business, and data-integrity logic
  that a future developer needs to understand. Avoid comments on obvious code.
- Keep the sprint focused on the stated goal and reuse existing patterns.

Before finishing:
- Run the relevant tests, production build, dependency audit, and a live UI
  check when applicable.
- Update root CHANGELOG.md, docs/10_SPRINT_HISTORY.md, docs/02_ROADMAP.md,
  every affected technical document, docs/CURRENT_HANDOVER.md, and this
  docs/NEXT_CHAT_PROMPT.md for the following sprint.
- Confirm secrets, logs, and runtime uploads are excluded from Git.
- Commit and push the completed sprint to origin/main.
- Report the commit, tests, database impact, remaining limitations, and the
  copy-ready prompt for the following chat.
```
