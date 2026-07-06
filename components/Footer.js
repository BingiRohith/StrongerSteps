import Link from 'next/link';
import { Footprints, Youtube, Instagram, Facebook, MessageCircle } from 'lucide-react';

const SOCIAL_LINKS = [
  { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'WhatsApp Community', href: '/join', icon: MessageCircle },
  { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
];

const FOOTER_COLUMNS = [
  {
    title: 'Knowledge Center',
    links: [
      { label: 'Blogs (A\u2013Z)', href: '/knowledge-center#blogs' },
      { label: 'Courses', href: '/knowledge-center#courses' },
      { label: 'Infographics', href: '/knowledge-center#infographics' },
      { label: 'Tools & Calculators', href: '/knowledge-center#tools' },
      { label: 'Resources', href: '/knowledge-center#resources' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Programs', href: '/programs' },
      { label: 'Products', href: '/products' },
      { label: 'About Us', href: '/about' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Join Us',
    links: [
      { label: 'Join the Community', href: '/join#community' },
      { label: 'Attend Workshops', href: '/join#workshops' },
      { label: 'Partner With Us', href: '/join#partner' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="mx-auto max-w-content px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary-dark">
                <Footprints size={20} aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-bold">
                Stronger<span className="text-accent">Steps</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-white/75">
              Helping adults 50+ stay strong, independent, and confident through
              exercise, nutrition, education, and community. Small steps. Stronger years.
            </p>
            <ul className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-accent hover:text-primary-dark"
                    aria-label={label}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-accent">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-sm text-white/60 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Stronger Steps. All rights reserved.</p>
          <p>Small Steps. Stronger Years.</p>
        </div>
      </div>
    </footer>
  );
}
