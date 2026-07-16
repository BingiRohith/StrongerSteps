import { GraduationCap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * CMS-ready course card (Sprint 18 Module 6) — the field shape here
 * (thumbnail/title/description/price/badge/tier) intentionally matches what
 * a future `Course` model would carry, so Sprint 19's Courses CMS can wire
 * real data into this component without a redesign. No CRUD/model/API
 * exists yet — `app/knowledge-center/page.js`'s FREE_COURSES/PREMIUM_COURSES
 * arrays are still hardcoded, just richer than before.
 */
export default function CourseCard({ thumbnail, title, description, price, badge = 'Coming Soon', tier = 'free' }) {
  const isPremium = tier === 'premium';
  const TierIcon = isPremium ? Sparkles : GraduationCap;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
      <div className={`relative aspect-[16/10] w-full shrink-0 overflow-hidden ${isPremium ? 'bg-accent-soft' : 'bg-sage'}`}>
        {thumbnail?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- CMS-ready thumbnail field, not yet backed by an optimizable upload pipeline
          <img src={thumbnail.url} alt={thumbnail.alt || ''} className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${isPremium ? 'text-accent-dark/40' : 'text-primary/25'}`}>
            <TierIcon size={36} aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-3 top-3">
          <Badge tone={isPremium ? 'accent' : 'sage'}>{badge}</Badge>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className={`text-[11px] font-semibold uppercase tracking-wide ${isPremium ? 'text-accent-dark' : 'text-primary'}`}>
          {isPremium ? 'Premium' : 'Free'}
        </p>
        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-primary-dark">{title}</h3>
        {description && <p className="mt-2 flex-1 text-sm text-muted">{description}</p>}

        <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3">
          <span className="font-display text-sm font-bold text-primary-dark">
            {price ? `₹${Number(price).toLocaleString('en-IN')}` : 'Free'}
          </span>
          <span className="text-xs font-semibold text-muted">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
