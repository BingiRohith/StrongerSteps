# 15. Sprint Continuation Workflow

This file is the permanent handover rule for StrongerSteps. The project is developed one sprint per Codex chat so each chat stays focused and uses less context. A sprint is incomplete until its code, verification, and written handover agree.

## Before changing code

1. Pull or inspect the latest `main` branch and confirm the working tree.
2. Read `docs/CURRENT_HANDOVER.md`, `docs/02_ROADMAP.md`, and the relevant architecture/database/API/admin documents.
3. Inspect the actual implementation. Documentation is a guide, but code and runtime behaviour must be verified because older notes can become stale.
4. Read `.env.example` for variable names. Never display or commit values from `.env.local`.
5. Preserve the current Atlas database and uploaded content unless the user explicitly authorizes a migration, deletion, or reset.

## While implementing

- Add concise comments around security rules, data-integrity rules, unusual business logic, and decisions a future developer could otherwise misread.
- Do not comment obvious JSX or restate each line of code.
- Reuse existing project patterns before introducing another abstraction or dependency.
- Keep changes inside the agreed sprint scope. Record newly discovered issues in the roadmap or current handover instead of silently expanding the sprint.
- Explain database impact clearly: whether a change reads data, writes data, changes a schema, or requires a migration.

## Required verification

Run checks appropriate to the change. For normal application sprints this means at least:

```bash
npm test
npm run build
npm audit --omit=dev
```

Also exercise the changed user flow in the running application. Avoid creating, modifying, or deleting production-like Atlas records solely for a smoke test when a read-only check is sufficient.

## Required documentation before finishing

Every task that changes behaviour, dependencies, configuration, data shape, or developer workflow must update written documentation in the same commit. At minimum:

1. Root `CHANGELOG.md` — detailed behaviour, reason, data impact, and tests.
2. `docs/10_SPRINT_HISTORY.md` — one concise sprint summary.
3. `docs/02_ROADMAP.md` — mark completed work and accurately state what remains.
4. The affected reference document: database, API, admin, architecture, access control, decisions, or deployment as applicable.
5. `docs/CURRENT_HANDOVER.md` — replace its contents with the actual current state, verification, risks, and exact next starting point.
6. `docs/NEXT_CHAT_PROMPT.md` — replace its prompt with a copy-ready prompt for the next sprint/chat.

A small documentation-only correction does not need a new numbered sprint, but it must still be recorded in `CHANGELOG.md` and the current handover.

## Git and GitHub handoff

- Confirm no secrets, logs, `.env.local`, or new runtime uploads are staged.
- Review `git diff --cached --check` and scan added lines for credentials.
- Use a commit message that names the completed sprint or behaviour.
- Push to `origin/main` only after tests and documentation are complete.
- Record the pushed commit in the final response. The next-chat prompt should tell the next developer to verify the latest commit rather than hardcoding a hash that immediately becomes stale.

## Definition of done

A sprint is done only when another developer can answer these questions from the repository:

- What changed and why?
- Which files and APIs are involved?
- Did the database or stored data change?
- How was it tested?
- What remains incomplete or risky?
- What exactly should the next sprint start with?
