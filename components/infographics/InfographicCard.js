import { Image as ImageIcon, FileText, Eye } from 'lucide-react';
import { Badge } from '@/components/ui';

export default function InfographicCard({ infographic, onView }) {
  if (!infographic) return null;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white transition-colors hover:border-primary">
      <button
        type="button"
        onClick={() => onView(infographic)}
        className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-sage"
        aria-label={`View ${infographic.title}`}
      >
        {infographic.thumbnailImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
          <img
            src={infographic.thumbnailImage.url}
            alt={infographic.thumbnailImage.alt || infographic.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            <ImageIcon size={32} aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/30 group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-dark">
            <Eye size={16} aria-hidden="true" />
            View
          </span>
        </div>
        {infographic.category && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">{infographic.category}</Badge>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug text-primary-dark line-clamp-2">
          {infographic.title}
        </h3>
        {infographic.description && (
          <p className="mt-2 flex-1 text-sm text-muted line-clamp-3">{infographic.description}</p>
        )}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(infographic)}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <Eye size={13} aria-hidden="true" />
            View
          </button>
          {infographic.pdf?.url && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark">
              <FileText size={13} aria-hidden="true" />
              PDF available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
