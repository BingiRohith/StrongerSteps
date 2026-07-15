/**
 * Hand-drawn tree illustration backing the Organization Tree (Sprint 14
 * rev. 2 — the client rejected a plain auto-generated connector-line org
 * chart and asked for a real illustrated tree, referencing a two-tone
 * branch layout). Built the same way `WhyItMattersHand.js`/`VisionHouse.js`
 * illustrate their sections: hand-coded shapes in the Stronger Steps
 * palette, not a stock image or icon-library asset — trunk in
 * `primary-dark`, one branch family in `primary`/`primary-light` (green)
 * and the other in `accent`/`accent-dark` (terracotta), mirroring the
 * reference's two-colour branch split while staying on-brand.
 *
 * Purely decorative background — `components/team/OrgTree.js` (public) and
 * `components/admin/team/TreePositionEditor.js` (admin) both absolutely
 * position member markers on top of this same SVG by percentage, so
 * "near the trunk" / "out on a branch" placement is an admin choice, not
 * something this illustration hardcodes per member.
 */
export default function TeamTreeIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 800 1000"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Illustrated tree: a trunk rising from the roots, splitting into leafy green and terracotta branches"
    >
      {/* Ground shadow */}
      <ellipse cx="400" cy="978" rx="170" ry="16" className="fill-primary-dark/10" />

      {/* Right branch family (accent/terracotta) — drawn first, sits behind trunk+left */}
      <path
        d="M 410 600 C 470 540, 540 500, 600 430 C 630 395, 650 360, 660 320"
        fill="none"
        className="stroke-accent"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M 470 555 C 540 520, 600 500, 655 460"
        fill="none"
        className="stroke-accent-dark"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d="M 520 500 C 555 430, 580 370, 585 300"
        fill="none"
        className="stroke-accent"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M 590 440 C 640 410, 680 400, 715 385"
        fill="none"
        className="stroke-accent-dark"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Left branch family (primary/green) */}
      <path
        d="M 390 600 C 330 540, 260 500, 200 430 C 170 395, 150 360, 140 320"
        fill="none"
        className="stroke-primary"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M 330 555 C 260 520, 200 500, 145 460"
        fill="none"
        className="stroke-primary-dark"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d="M 280 500 C 245 430, 220 370, 215 300"
        fill="none"
        className="stroke-primary"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M 210 440 C 160 410, 120 400, 85 385"
        fill="none"
        className="stroke-primary-dark"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Leaf clusters — soft, layered circles at branch tips (behind member markers) */}
      {[
        [140, 300, 62, 'fill-primary/25'],
        [90, 375, 46, 'fill-primary/20'],
        [145, 450, 50, 'fill-primary-dark/15'],
        [215, 285, 55, 'fill-primary/20'],
        [250, 420, 44, 'fill-primary/15'],
        [660, 300, 62, 'fill-accent/25'],
        [715, 375, 46, 'fill-accent/20'],
        [655, 450, 50, 'fill-accent-dark/15'],
        [585, 285, 55, 'fill-accent/20'],
        [545, 420, 44, 'fill-accent/15'],
      ].map(([cx, cy, r, cls], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} className={cls} />
      ))}

      {/* Trunk */}
      <path
        d="M 362 978 C 356 840, 372 700, 384 600 L 416 600 C 428 700, 444 840, 438 978 Z"
        className="fill-primary-dark"
      />

      {/* Root flare */}
      <path
        d="M 340 978 C 350 950, 365 935, 384 928 L 384 978 Z"
        className="fill-primary-dark/70"
      />
      <path
        d="M 460 978 C 450 950, 435 935, 416 928 L 416 978 Z"
        className="fill-primary-dark/70"
      />
    </svg>
  );
}
