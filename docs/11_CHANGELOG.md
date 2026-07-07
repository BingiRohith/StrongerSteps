# 11. Changelog

The canonical, detailed changelog for this project is the root
[`CHANGELOG.md`](../CHANGELOG.md) — it predates this `docs/` folder and is
already the established convention (one section per sprint, `Added`/
`Modified`/`Not touched`/`Not implemented`/`Setup for next session`
subsections, verification notes).

## Decision: keep the changelog at the root, not in `docs/`

Rather than moving or duplicating 44KB of existing sprint history into
`docs/11_CHANGELOG.md`, this file stays as a pointer. Moving it would break
any existing links/expectations and offers no benefit — the root location is
already correct and working. See [13_DECISIONS.md](13_DECISIONS.md) for the
reasoning.

**Going forward:** every new sprint should keep appending to root
`CHANGELOG.md` at the top (most recent first, matching the existing order),
using the same section structure as the existing entries. Also update
[10_SPRINT_HISTORY.md](10_SPRINT_HISTORY.md)'s summary table so the condensed
index doesn't drift out of sync with the full log.
