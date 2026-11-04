import { Loader2 } from 'lucide-react';

/**
 * Shared route-segment loading UI (each top-level segment's loading.js),
 * matching the same spinner pattern already used for in-page fetch loading
 * states (e.g. components/courses/CoursesPageClient.js) so route-level
 * loading doesn't introduce a second visual language.
 */
export default function RouteLoading({ label = 'Loading…' }) {
  return (
    <div className="mx-auto flex max-w-content items-center justify-center gap-2 px-4 py-24 text-sm text-muted sm:px-6">
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}
