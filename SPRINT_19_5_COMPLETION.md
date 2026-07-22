# Sprint 19.5 Completion — Courses → Learning Management System

**Date:** 2026-07-22
**Status:** Complete
**Scope:** Extend Sprint 19.2's existing Course→Section→Lesson CMS into an
LMS (multi-source video, richer lesson content, progress tracking/resume
learning, course player) without rebuilding any working Sprint 19.2/19.3/19.4
functionality.

---

## 1. Features completed

- **Multi-source lesson video** — admin picks Upload MP4 / YouTube URL /
  Vimeo URL / External hosted URL per lesson; the public player adapts
  automatically. One `Lesson` model, no new lesson-type-specific models.
- **Rich lesson content editor** — Tiptap-based editor (bold/italic/
  headings/lists/blockquote/code blocks/tables/info-warning-tip callouts/
  links/inline image upload) replacing the previous bare `<textarea>`.
  Lesson `body` is now real HTML, rendered accordingly on the public page.
- **Lesson attachments broadened** — PDF/Images/Word/PowerPoint/Excel/ZIP,
  all through the existing private-upload architecture.
- **Progress tracking & resume learning** — per-lesson completion,
  resume pointer, completion %, last-viewed/completed timestamps, in a new
  `CourseProgress` collection. Tracked only for a verified visitor
  (`VerifiedLead`) — browsing any PUBLIC lesson never requires verification;
  only saving progress does.
- **Course player rebuild** — previous/next lesson navigation, Mark
  Complete control, sidebar completion checkmarks + current-lesson
  highlight, "Resume learning" entry point on the course detail page,
  derived total course duration display.
- **Free vs Premium / future-payment architecture** — unchanged and
  confirmed compatible: `accessLevel` gating already existed at both
  Course and Lesson level; no payment gateway implemented (per brief).
- **Future-ready extensions (lightweight, not wired to UI/playback yet)**:
  `Lesson.video.captions[]` (WebVTT subtitle architecture placeholder) and
  the derived `Course.totalEstimatedDuration` (built from the existing
  per-lesson `estimatedDuration` field, which already existed pre-19.5).

## 2. Files created

- `models/CourseProgress.js`
- `lib/videoEmbed.js`
- `app/api/lessons/[id]/progress/route.js`
- `app/api/courses/[slug]/progress/route.js`
- `components/admin/courses/LessonRichTextEditor.js`
- `components/courses/LessonProgressControls.js`
- `tests/lib/videoEmbed.test.js`
- `SPRINT_19_5_COMPLETION.md` (this file)

## 3. Files modified

- `models/Lesson.js` — `video.source`, `video.captions`, `bodyImages`.
- `lib/privateUpload.js` — `saveProtectedAttachment()`.
- `lib/verification/resourceRegistry.js` — `body-image-<index>` fileKind.
- `lib/publicCourses.js` — derived `totalEstimatedDuration`.
- `lib/courseOptions.js` — `formatCourseDuration()`.
- `app/api/admin/courses/[id]/sections/[sectionId]/lessons/[lessonId]/route.js` — video/bodyImages handling + server-side video URL validation.
- `app/api/admin/courses/[id]/sections/[sectionId]/lessons/[lessonId]/upload/route.js` — `mediaType=bodyImage`, broadened `attachment`.
- `components/admin/courses/LessonEditorPanel.js` — video source selector, rich text editor, widened attachment picker.
- `components/courses/LessonOtpUnlock.js` — optional `heading`/`description`/`onVerified` props (reused for the progress-verify prompt).
- `components/courses/CourseCurriculumAccordion.js` — optional `progress` prop.
- `app/courses/[slug]/lessons/[lessonId]/page.js` — video-source-aware rendering, HTML body rendering, prev/next nav, Mark Complete control.
- `app/courses/[slug]/page.js` — Resume learning link, total duration display.
- `package.json` — added Tiptap dependencies.
- `docs/05_DATABASE.md`, `docs/06_API_DOCUMENTATION.md`, `docs/13_DECISIONS.md`, `docs/10_SPRINT_HISTORY.md`, `CHANGELOG.md`.

**Not modified** (already correct, reused as-is): `CurriculumManager.js`,
Course/Section admin CRUD routes, Course/Section models, category
management, `lib/access/*`, `lib/auth.js`, `middleware.js`.

## 4. Database changes

All additive — no destructive migration, no existing data affected:

| Model | Change |
|---|---|
| `Lesson` | + `video.source` (enum, default `upload`), `video.captions[]` (unused placeholder), `bodyImages[]` |
| `CourseProgress` | **new collection** — `lead`, `course`, `completedLessons[]`, `currentLesson`, `completionPercent`, `lastViewedAt`, `startedAt`, `completedAt`; unique index `{lead, course}` |

`Course.totalEstimatedDuration` is **derived, not stored** (computed in
`lib/publicCourses.js` from existing `Lesson.estimatedDuration` values).

## 5. API changes

New:
- `POST /api/lessons/[id]/progress`
- `GET /api/courses/[slug]/progress`

Modified (backward-compatible, additive):
- `PUT .../lessons/[lessonId]` — accepts `video.source`/`video.captions`/`bodyImages`
- `POST .../lessons/[lessonId]/upload` — accepts `mediaType=bodyImage`; `attachment` now accepts a broader file-type allowlist
- `GET /api/lessons/[id]/media` — accepts `fileKind=body-image-<index>`

No routes removed or renamed. No breaking changes.

## 6. UI changes

- Admin: lesson editor gained a video-source selector, the Tiptap rich
  text editor, and a broader attachment file picker.
- Public: course player (video/body rendering, prev/next nav, Mark
  Complete), course detail page (Resume learning, total duration),
  curriculum sidebar (completion checkmarks).

## 7a. Follow-up: browser verification of the Video Source UI

A follow-up review asked to confirm the Lesson Editor actually exposes the
Video Source UI (it does, `components/admin/courses/LessonEditorPanel.js`
lines ~237-330) and to verify it live rather than by code reading alone.
Two things came out of that:

1. **Added a real live preview.** Previously, choosing YouTube/Vimeo/
   External only showed a text label ("Recognized as youtube"); Upload only
   showed a text link. Both now render an actual embedded preview —
   `<iframe>` for YouTube/Vimeo, `<video>` for a direct file URL or an
   already-uploaded file, `<iframe>` fallback for other external URLs.
2. **Verified the Lesson Type → Video Source flow in a live browser**,
   without needing an admin login (the harness blocks filling in login
   credentials as a safety measure, even project-seeded ones) or touching
   real data: a temporary, unauthenticated page was created at
   `app/dev-test-lesson-editor/page.js` that rendered
   `LessonEditorPanel` directly with mock props, driven via automated
   browser interaction, then **deleted** once verification finished — it
   is not part of the shipped codebase (`git status`/`npm run build`'s
   route list confirm it's gone).
   - Confirmed: switching "Lesson type" to "Video" immediately reveals the
     "Video source" selector (Upload/YouTube/Vimeo/External) — reproduced
     the exact reported symptom and found it **was not reproducible**; the
     dropdown and conditional section work as coded.
   - Confirmed: entering a YouTube URL renders a working embedded preview
     (`iframe.src` correctly resolved to `https://www.youtube.com/embed/<id>`,
     visually confirmed via screenshot).
   - Confirmed: Vimeo URL resolves to `https://player.vimeo.com/video/<id>`.
   - Confirmed: switching back to "Upload" restores the file-upload UI.
   - **Not yet verified**: saving a video lesson through the real
     `PUT`/`upload` API routes and confirming it renders on the public
     course player, since that requires an authenticated admin session
     against the real database — this needs either the user to grant
     permission for the harness to use the seeded `.env.local` admin
     login, or the user to click through it themselves. See the manual
     testing checklist below.

## 7. Manual testing checklist

- [x] Video Source UI itself (dropdown, per-source inputs, live preview) —
      verified interactively via an isolated, unauthenticated harness (see
      §7a). **Still needs:** [ ] saving a video lesson of each source
      through the real admin flow against a live database and confirming
      playback on the public lesson page (requires an authenticated admin
      session).
- [ ] Author a text lesson using the new editor: bold/italic/heading/list/
      quote/code block/table/callout/link/inline image — confirm it renders
      correctly on the public page.
- [ ] Upload an attachment of each type (PDF, image, ZIP, Word/PowerPoint/
      Excel) and confirm each downloads correctly.
- [ ] As an anonymous visitor: browse a PUBLIC lesson freely (no
      verification prompt to *view*); click Mark Complete → verify the OTP
      prompt appears; complete OTP → progress now saves.
- [ ] As a verified visitor: mark several lessons complete, reload the
      course detail page, confirm "Resume learning" links to the last
      viewed lesson and the sidebar shows checkmarks.
- [ ] Confirm previous/next navigation works correctly at the first and
      last lesson of a course (buttons correctly absent at the boundaries).
- [ ] Confirm the pre-existing OTP-gated lesson unlock flow
      (`LessonOtpUnlock`'s original use, unrelated to progress) still works
      unchanged.
- [ ] Regression pass: Course/Section admin CRUD, category management,
      existing published courses/lessons render unchanged.

## 8. Build status

- `npm test` — **141/141 passing** (unchanged; the live-preview follow-up
  changes are UI-only, no new test surface).
- `npm run build` — **clean, no errors, no warnings**, re-verified after
  the live-preview follow-up changes. (Earlier in this sprint, one real
  Tiptap import warning — `@tiptap/extension-table` has no default export —
  was found and fixed by switching to a named import.)
- **Environment note:** the build machine's C: drive was at 100% disk
  usage (0 bytes free) at the start of this sprint's first verification
  pass, which initially failed `npm run build` with "No space left on
  device." Per explicit instruction, only the project's `.next` build
  cache was deleted (freeing ~469MB, unrelated to any code in this
  sprint) — `node_modules`, uploads, `.env` files, and all other data were
  left untouched. By the follow-up verification pass, ~5GB was free again
  (external to this session), and the full rebuild completed cleanly.

## 9. Documentation updated

- `docs/05_DATABASE.md` — `Lesson`/`CourseProgress` entries.
- `docs/06_API_DOCUMENTATION.md` — new progress routes, upload route changes.
- `docs/13_DECISIONS.md` — 4 new entries (progress requires OTP verification,
  `CourseProgress` as its own lead-FK collection, Tiptap as a scoped
  dependency exception, `video.captions` as an architecture-only placeholder).
- `docs/10_SPRINT_HISTORY.md` — condensed Sprint 19.5 row.
- `CHANGELOG.md` — full detailed entry.

## 10. Recommendations for Sprint 19.6 (Zoho CRM Integration)

- `VerifiedLead` is already the platform's single identity anchor
  (email/mobile, membership, purchases, and now course progress) — a Zoho
  sync should key off `VerifiedLead._id`/email/mobile, not invent a
  parallel identity concept.
- `CourseProgress` (completion %, completed lessons, timestamps) is
  already shaped to feed a CRM "engagement" or "course completion" signal
  with no further schema work — a Zoho sync job can read it directly.
- Consider whether Zoho should be pushed to on every `CourseProgress`
  write (real-time) or on a scheduled batch — this sprint deliberately
  didn't add any outbound-webhook/queue infrastructure, so that choice is
  still fully open.
- The disk-space constraint noted above should be resolved before Sprint
  19.6 begins, independent of any code changes.
