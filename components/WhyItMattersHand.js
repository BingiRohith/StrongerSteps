/**
 * Hand illustration for the homepage "Why It Matters" section.
 * The palm (bottom band) is the foundation everything rests on; each of the
 * five "finger" columns rising from it carries one of the five existing
 * Why It Matters points — content is untouched, only the layout is new.
 */
export default function WhyItMattersHand({ items }) {
  return (
    <div
      className="rounded-xl2 bg-white/5 p-6 md:p-10"
      role="img"
      aria-label="Hand illustration: an open palm as the foundation, with five fingers each representing one reason strength matters after 50"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        {items.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center text-center">
            {/* Fingertip */}
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-primary-dark shadow-md">
              <Icon size={24} aria-hidden="true" />
            </span>
            {/* Finger */}
            <span className="mt-1 h-6 w-2 rounded-full bg-accent/40" aria-hidden="true" />

            <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-white/75">{description}</p>
          </div>
        ))}
      </div>

      {/* Palm — the foundation */}
      <div
        className="mt-6 flex h-10 items-center justify-center rounded-xl2 bg-accent/20 md:h-14"
        aria-hidden="true"
      >
        <span className="h-1.5 w-24 rounded-full bg-accent/60 md:w-40" />
      </div>
    </div>
  );
}
