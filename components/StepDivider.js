/**
 * StepDivider
 *
 * The site's signature motif: an ascending staircase silhouette used to
 * transition between section backgrounds. It echoes the brand's core idea
 * ("Small Steps. Stronger Years.") and the recurring "stairs" theme in the
 * content (stair-climbing as a health indicator, the Stair Challenge, etc).
 *
 * `from` is the color of the section above, `to` is the color the staircase
 * is "stepping into" (the section below). `flip` mirrors the steps so the
 * climb can alternate direction as you scroll down the page.
 */
export default function StepDivider({ from = '#FBF7EF', to = '#E6EEE4', flip = false }) {
  return (
    <div
      className="step-divider w-full h-8 md:h-12"
      aria-hidden="true"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
        <rect width="1200" height="60" fill={from} />
        <path
          d="M0,60 L0,52.5 L150,52.5 L150,45 L300,45 L300,37.5 L450,37.5 L450,30 L600,30 L600,22.5 L750,22.5 L750,15 L900,15 L900,7.5 L1050,7.5 L1050,0 L1200,0 L1200,60 Z"
          fill={to}
        />
      </svg>
    </div>
  );
}
