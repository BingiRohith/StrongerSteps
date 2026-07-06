import { Badge } from './ui';

export default function ComingSoonCard({ icon: Icon, title, description, badgeLabel = 'Coming Soon', tone = 'outline' }) {
  return (
    <div className="flex h-full flex-col rounded-xl2 border border-dashed border-line bg-white/70 p-6">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <h3 className="mt-4 font-display text-base font-semibold text-primary-dark">{title}</h3>
      {description && <p className="mt-2 flex-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">
        <Badge tone={tone}>{badgeLabel}</Badge>
      </div>
    </div>
  );
}
