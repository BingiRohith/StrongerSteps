# Current Handover

Last updated: 2026-10-06

## Latest completed work

Sprint 22 is complete. The reusable Media Library now supports images, PDFs, Office documents, and MP4/WebM/Ogg videos without altering any previous Atlas record or upload. Images retain the Sprint 21 public path; new non-image assets are catalogued and held privately in `private-uploads/media/`.

Admins can upload, search, browse, authenticated-preview, inspect usage, and delete unreferenced managed assets. Resource File editing can choose a shared asset of its matching type. The saved `mediaId` is additive and the parent Resource File's access setting remains authoritative: public/OTP/member/purchased/admin checks happen before shared bytes are served. Legacy protected files and their routes were not moved or migrated.

## Verified state

- `npm test`: 143 tests passed.
- `npm run build`: passed on Next.js 15.5.24.
- `npm audit --omit=dev`: zero production vulnerabilities.
- Runtime uploads, logs, and `.env.local` remain excluded from Git.
- Browser smoke testing needs a signed-in admin. Do not use existing records for deletion tests; a disposable new asset is appropriate only when the user authorizes a write to Atlas.

## Database impact

`Media.kind` and `Media.storage`, plus optional Media references on Resource File and Lesson media shapes, are additive. The `Media` collection changes only when an admin uploads a new library asset. No migration, reset, reseed, or existing-record/file write was performed.

## Remaining limitations

- Library reuse is wired into Resource Files; Lessons retain their established direct-upload UI, though their serving route already supports shared media references for a future UI extension.
- Local disk storage is not durable for serverless/multi-instance deployment; provider migration and resumable large-video uploads remain separate work.
- Older Next.js 15 synchronous dynamic API warnings remain logged technical debt; the production build passes.

## Next developer starting point

Use `docs/NEXT_CHAT_PROMPT.md`. Verify the latest commit and actual code before selecting a narrowly scoped next sprint. Do not recreate `.env.local`, reseed the admin account, reset MongoDB, or migrate old uploads.
