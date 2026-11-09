import Link from 'next/link';
import { BookOpen, Library, ArrowRight } from 'lucide-react';

/**
 * Sprint 19.7a — lets the dashboard work as the member's landing page
 * after login (per sprint refinement) without building any new pages,
 * just navigation into existing Knowledge Center / Courses sections.
 */
const LINKS = [
  { href: '/knowledge-center', label: 'Knowledge Center', icon: Library },
  { href: '/courses', label: 'Courses', icon: BookOpen },
];

export default function QuickLinksCard() {
  return (
    <div className="rounded-xl2 border border-line bg-white p-6">
      <h2 className="font-display text-base font-bold text-primary-dark">Quick Links</h2>
      <ul className="mt-4 space-y-2">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              <span className="flex items-center gap-2">
                <Icon size={16} aria-hidden="true" />
                {label}
              </span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
