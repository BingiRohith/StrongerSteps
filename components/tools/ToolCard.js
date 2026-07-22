import Link from 'next/link';
import { Clock, Wrench, Star } from 'lucide-react';
import { Badge } from '@/components/ui';
import { toolTypeLabel } from '@/lib/toolOptions';

/**
 * Sprint 19.4 — mirrors components/resources/ResourceCard.js's shape
 * exactly. Links to /tools/[slug]. `tool.accessLevel` is informational only
 * (same as Resource/Course) — the real gate is enforced when submitting the
 * assessment for a scored result (see app/api/tools/[slug]/attempt/route.js).
 */
export default function ToolCard({ tool }) {
  if (!tool) return null;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white transition-colors hover:border-primary"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-sage">
        {tool.thumbnail?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
          <img
            src={tool.thumbnail.url}
            alt={tool.thumbnail.alt || tool.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            <Wrench size={36} aria-hidden="true" />
          </div>
        )}
        {tool.category?.name && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">{tool.category.name}</Badge>
          </span>
        )}
        {tool.featured && (
          <span className="absolute right-3 top-3">
            <Badge tone="primary">
              <Star size={11} className="mr-1 -ml-0.5 fill-current" aria-hidden="true" />
              Featured
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug text-primary-dark line-clamp-2 group-hover:text-primary">
          {tool.title}
        </h3>
        {tool.description && (
          <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{tool.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-dark">
            {toolTypeLabel(tool.toolType)}
          </span>
          {tool.estimatedMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={13} aria-hidden="true" />
              {tool.estimatedMinutes} min
            </span>
          )}
        </div>

        {tool.accessLevel && tool.accessLevel !== 'PUBLIC' && (
          <div className="mt-3">
            <Badge tone="sage">{tool.accessLevel}</Badge>
          </div>
        )}
      </div>
    </Link>
  );
}
