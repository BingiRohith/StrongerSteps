# StrongerSteps — Documentation Index

This `docs/` folder is the single source of truth for the StrongerSteps
project, as required by the project's master context. It was reconstructed
on **2026-07-07** from the actual codebase, the root [`README.md`](../README.md)
(setup guide), and the root [`CHANGELOG.md`](../CHANGELOG.md) (detailed
sprint-by-sprint build log) — it did not exist before this documentation
sprint.

## Reading order

| Doc | Purpose |
|---|---|
| [01_PROJECT_HANDOVER.md](01_PROJECT_HANDOVER.md) | What StrongerSteps is, who it's for, current state at a glance |
| [02_ROADMAP.md](02_ROADMAP.md) | Completed vs. planned modules against the long-term platform goal |
| [03_CLIENT_REQUIREMENTS.md](03_CLIENT_REQUIREMENTS.md) | **VERIFIED, client-approved CRS — the single source of truth for all scope.** Every sprint must be checked against it. |
| [04_ARCHITECTURE.md](04_ARCHITECTURE.md) | Tech stack, folder structure, request flow, auth model, upload strategy |
| [05_DATABASE.md](05_DATABASE.md) | Every Mongoose schema, field-by-field, with relationships |
| [06_API_DOCUMENTATION.md](06_API_DOCUMENTATION.md) | Every API route: method, auth, params, response shape |
| [07_ADMIN_MODULES.md](07_ADMIN_MODULES.md) | What each admin panel section does today |
| [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md) | Conventions actually in use in this codebase |
| [09_DEPLOYMENT.md](09_DEPLOYMENT.md) | Environment variables, build/start, hosting caveats |
| [10_SPRINT_HISTORY.md](10_SPRINT_HISTORY.md) | Condensed sprint-by-sprint history (full detail stays in root CHANGELOG.md) |
| [11_CHANGELOG.md](11_CHANGELOG.md) | Pointer to the canonical changelog location + this project's changelog convention |
| [12_FUTURE_IDEAS.md](12_FUTURE_IDEAS.md) | Backlog ideas beyond the committed roadmap |
| [13_DECISIONS.md](13_DECISIONS.md) | Architectural decisions and why, including conflicts found during this sprint |

## Governance: the CRS is the source of truth

[03_CLIENT_REQUIREMENTS.md](03_CLIENT_REQUIREMENTS.md) was replaced on
2026-07-07 with a verified, client-approved Client Requirements Specification
(CRS v1.0). As of that date:

- The CRS is the single source of truth for scope. Any previously inferred
  requirements (old speculative notes elsewhere in this folder) are
  superseded.
- Every sprint must be checked against the CRS **before** implementation.
- If a requested change conflicts with the CRS, ask for confirmation before
  building it — don't silently resolve the conflict either direction.

## How to keep this current

Every sprint should update at minimum: [10_SPRINT_HISTORY.md](10_SPRINT_HISTORY.md),
the root `CHANGELOG.md`, and [02_ROADMAP.md](02_ROADMAP.md) (which is now a
live CRS-vs-implementation gap analysis — keep it in sync as CRS items are
closed). Update [05_DATABASE.md](05_DATABASE.md) and
[06_API_DOCUMENTATION.md](06_API_DOCUMENTATION.md) whenever a model or route
is added/changed — they are hand-written snapshots, not generated, so they
will drift if forgotten.
