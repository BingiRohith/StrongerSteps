export default function PagePlaceholder({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl2 border border-dashed border-line bg-surface px-6 py-16 text-center">
      {Icon && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sage text-primary-dark">
          <Icon size={26} strokeWidth={2} />
        </span>
      )}
      <h2 className="font-display text-xl font-bold text-primary-dark">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      <span className="mt-6 inline-flex items-center rounded-full bg-accent-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-dark">
        Coming in a future sprint
      </span>
    </div>
  );
}
