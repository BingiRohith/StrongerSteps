/**
 * House illustration for the homepage "Our Vision" section.
 * The roof spans the top and carries the "Stronger Steps" name; the four
 * pillars below it reuse the four existing vision points unchanged — only
 * the layout is new.
 */
export default function VisionHouse({ items }) {
  return (
    <div role="img" aria-label="House illustration: a roof reading Stronger Steps resting on four pillars, one for each vision point">
      {/* Roof */}
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-t-xl2 bg-primary-dark px-6 py-5 text-center md:py-6">
        <span className="font-display text-xl font-bold text-white md:text-2xl">
          Stronger Steps
        </span>
      </div>

      {/* Pillars */}
      <div className="grid gap-6 rounded-b-xl2 bg-sage/60 p-6 sm:grid-cols-2 lg:grid-cols-4 md:p-10">
        {items.map(({ icon: Icon, title, description }, i) => (
          <div key={title} className="flex flex-col items-center text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
              <Icon size={24} aria-hidden="true" />
            </span>
            {/* Pillar shaft */}
            <span className="mt-2 h-8 w-3 rounded-full bg-primary/25 md:h-12" aria-hidden="true" />
            <h3 className="mt-2 font-display text-xl font-bold text-primary-dark">{title}</h3>
            <p className="mt-2 text-sm text-muted">{description}</p>
          </div>
        ))}
      </div>

      {/* Foundation */}
      <div className="mx-auto mt-3 h-2 w-full max-w-2xl rounded-full bg-primary-dark/20" aria-hidden="true" />
    </div>
  );
}
