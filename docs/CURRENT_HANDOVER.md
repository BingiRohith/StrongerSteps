# Current Handover

Last updated: 2026-10-06

## Latest completed work

Sprint 20 is complete and pushed to `origin/main`. It restored the project, removed Zoho/CRM work from current scope, secured booking lookup and rich HTML, upgraded dependencies, corrected curriculum/dashboard gaps, and completed the Blog Categories admin module.

The follow-up documentation process update makes this file and `NEXT_CHAT_PROMPT.md` mandatory at the end of each future sprint.

## Verified state

- Local development server uses `http://localhost:3001` when port 3000 is unavailable.
- Admin login and `/admin/categories` were verified in the browser.
- Two existing Blog Categories loaded from Atlas during read-only testing.
- `npm test`: 143 tests passed.
- `npm run build`: passed.
- Production dependency audit: zero vulnerabilities.

## Database impact

Sprint 20 introduced no destructive migration and did not reset Atlas. The new Blog Categories screens use the existing `Category` collection. The browser verification did not submit its example form, so it wrote no record.

## Known development note

Next.js 15 reports development warnings in older routes that access dynamic `params` or `cookies()` synchronously. The production build passes, but a future maintenance sprint should update those older call sites to the Next.js 15 async API convention.

## Next product decision

The highest-value remaining current-scope item is a reusable Media Library (CRS §15/§18), since uploads are still stored and selected separately inside each module. This is a substantial product sprint: storage, browsing, selection, reuse, deletion rules, and migration behaviour should be defined before implementation.

Other future choices are role management, payments, and communication integrations. These require explicit sprint scope and, for external services, provider decisions.

## Next developer starting point

Use `docs/NEXT_CHAT_PROMPT.md`. Replace its `SPRINT GOAL` placeholder with the user-approved goal. Do not recreate `.env.local`, reseed the admin account, or reset MongoDB.
