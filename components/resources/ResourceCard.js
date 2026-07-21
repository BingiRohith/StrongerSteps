import Link from 'next/link';
import { Clock, Library, Star, User } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * Sprint 19.3 — mirrors components/courses/CourseCard.js's shape exactly.
 * Links to /resources/[slug]. `resource.accessLevel` is informational only
 * (see models/Resource.js) — shown as a hint, same as Course's badge; the
 * real per-file gate is enforced on the detail page's Downloads section.
 */
export default function ResourceCard({ resource }) {
  if (!resource) return null;

  return (
    <Link
      href={`/resources/${resource.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white transition-colors hover:border-primary"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-sage">
        {resource.thumbnail?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
          <img
            src={resource.thumbnail.url}
            alt={resource.thumbnail.alt || resource.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            <Library size={36} aria-hidden="true" />
          </div>
        )}
        {resource.category?.name && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">{resource.category.name}</Badge>
          </span>
        )}
        {resource.featured && (
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
          {resource.title}
        </h3>
        {resource.description && (
          <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{resource.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          {resource.estimatedReadingTime > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={13} aria-hidden="true" />
              {resource.estimatedReadingTime} min
            </span>
          )}
          {resource.author && (
            <span className="inline-flex items-center gap-1">
              <User size={13} aria-hidden="true" />
              {resource.author}
            </span>
          )}
        </div>

        {resource.accessLevel && resource.accessLevel !== 'PUBLIC' && (
          <div className="mt-3">
            <Badge tone="sage">{resource.accessLevel}</Badge>
          </div>
        )}
      </div>
    </Link>
  );
}
