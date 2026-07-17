import Link from 'next/link';
import { Clock, GraduationCap, Star } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * Sprint 19.2 — replaces the Sprint 18 hardcoded-array placeholder with a
 * real, DB-backed card (mirrors components/recipes/RecipeCard.js's shape).
 * Links to /courses/[slug]. `course.accessLevel` is shown as a small badge
 * so a visitor knows before clicking whether a course needs verification/
 * membership/purchase — the actual gate is enforced on the detail/lesson
 * pages, this is just a hint.
 */
export default function CourseCard({ course }) {
  if (!course) return null;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white transition-colors hover:border-primary"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-sage">
        {course.thumbnail?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
          <img
            src={course.thumbnail.url}
            alt={course.thumbnail.alt || course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            <GraduationCap size={36} aria-hidden="true" />
          </div>
        )}
        {course.category?.name && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">{course.category.name}</Badge>
          </span>
        )}
        {course.featured && (
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
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{course.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          {course.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock size={13} aria-hidden="true" />
              {course.duration}
            </span>
          )}
          {course.difficulty && <span>{course.difficulty}</span>}
          {course.instructors?.[0]?.name && (
            <span>
              {course.instructors[0].name}
              {course.instructors.length > 1 ? ` +${course.instructors.length - 1}` : ''}
            </span>
          )}
        </div>

        {course.accessLevel && course.accessLevel !== 'PUBLIC' && (
          <div className="mt-3">
            <Badge tone="sage">{course.accessLevel}</Badge>
          </div>
        )}
      </div>
    </Link>
  );
}
