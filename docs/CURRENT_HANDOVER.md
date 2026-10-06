# Current Handover

Last updated: 2026-10-06

## Latest completed work

Sprint 21 is complete: it added the reusable image Media Library required by
CRS §15/§18, without migrating or altering existing Atlas records/uploads.
New shared images are catalogued in `Media`; prior module-specific public
uploads are discovered for browsing/reuse and deliberately remain untouched.

The follow-up documentation process update makes this file and `NEXT_CHAT_PROMPT.md` mandatory at the end of each future sprint.

## Verified state

- Local development server uses `http://localhost:3001` when port 3000 is unavailable.
- `npm test`: 143 tests passed.
- `npm run build`: passed.
- The new Media Library's upload/delete UI still needs a browser smoke test
  with a signed-in admin before a production upload is attempted; do not use
  existing media records for destructive testing.
- `npm test`: 143 tests passed.
- `npm run build`: passed.
- Production dependency audit: zero vulnerabilities.

## Database impact

Sprint 21 adds the `Media` collection only when an admin uploads a new
library image. No migration, reset, reseed, or existing-record/file write was
performed. Managed deletion scans every content model and refuses to remove a
referenced file; legacy upload files cannot be deleted by this feature.

## Known development note

Next.js 15 reports development warnings in older routes that access dynamic `params` or `cookies()` synchronously. The production build passes, but a future maintenance sprint should update those older call sites to the Next.js 15 async API convention.

## Known limitation

The Media Library currently manages images only (JPEG/PNG/WebP/GIF). Videos,
documents, and PDFs remain in their existing protected course/resource/
infographic pipelines; centralizing them needs an explicit access-control and
storage decision because they are not universally public.

## Next product decision

The highest-value remaining current-scope choices are role management,
payments, communication, or a separately-scoped extension of Media Library
to protected documents/video/PDF. These require explicit sprint scope and,
for external services, provider decisions.

## Next developer starting point

Use `docs/NEXT_CHAT_PROMPT.md`. Replace its `SPRINT GOAL` placeholder with the user-approved goal. Do not recreate `.env.local`, reseed the admin account, or reset MongoDB.
