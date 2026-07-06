'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Footprints, Menu, X, ChevronDown, BookOpen, BarChart2, Image, Wrench, FolderOpen, Dumbbell, ShoppingBag, Users, HelpCircle, UserPlus, Calendar, Handshake } from 'lucide-react';
import { Button } from '@/components/ui';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  {
    label: 'Knowledge Center',
    href: '/knowledge-center',
    dropdown: [
      { href: '/knowledge-center#blogs', label: 'Blogs (A–Z)', icon: BookOpen, desc: 'Expert articles on healthy aging' },
      { href: '/knowledge-center#courses', label: 'Courses', icon: BarChart2, desc: 'Structured learning programs' },
      { href: '/knowledge-center#infographics', label: 'Infographics', icon: Image, desc: 'Visual health guides' },
      { href: '/knowledge-center#tools', label: 'Tools & Calculators', icon: Wrench, desc: 'BMI, steps, health trackers' },
      { href: '/knowledge-center#resources', label: 'Resources', icon: FolderOpen, desc: 'Downloadable guides & sheets' },
    ],
  },
  {
    label: 'Programs',
    href: '/programs',
    dropdown: [
      { href: '/programs#fitness', label: 'Fitness Programs', icon: Dumbbell, desc: 'Strength, balance & mobility' },
      { href: '/programs#nutrition', label: 'Nutrition Plans', icon: BarChart2, desc: 'Eat well, live stronger' },
      { href: '/programs#community', label: 'Community Sessions', icon: Users, desc: 'Group wellness activities' },
    ],
  },
  { href: '/products', label: 'Products' },
  {
    label: 'About Us',
    href: '/about',
    dropdown: [
      { href: '/about#story', label: 'Our Story', icon: BookOpen, desc: 'How Stronger Steps began' },
      { href: '/about#team', label: 'Our Team', icon: Users, desc: 'Doctors & wellness experts' },
      { href: '/about#faq', label: 'FAQ', icon: HelpCircle, desc: 'Common questions answered' },
    ],
  },
  {
    label: 'Join Us',
    href: '/join',
    dropdown: [
      { href: '/join#community', label: 'Join the Community', icon: UserPlus, desc: 'Free WhatsApp & events' },
      { href: '/join#workshops', label: 'Attend Workshops', icon: Calendar, desc: 'Live sessions in Hyderabad' },
      { href: '/join#partner', label: 'Partner With Us', icon: Handshake, desc: 'Collaborate & grow together' },
    ],
  },
];

function DropdownMenu({ items }) {
  return (
    <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 pt-2">
      <div className="rounded-2xl border border-line bg-surface shadow-xl ring-1 ring-ink/5 overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-sage"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon size={15} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink group-hover:text-primary-dark transition-colors">
                  {item.label}
                </span>
                <span className="block text-xs text-muted mt-0.5">{item.desc}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NavItem({ link, pathname }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const active = pathname === link.href || (link.dropdown && pathname.startsWith(link.href) && link.href !== '/');

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!link.dropdown) {
    return (
      <Link
        href={link.href}
        className={`font-display text-sm font-semibold transition-colors hover:text-primary ${
          active ? 'text-primary-dark' : 'text-ink/70'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        {link.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={`flex items-center gap-1 font-display text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none ${
          active ? 'text-primary-dark' : 'text-ink/70'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {link.label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && <DropdownMenu items={link.dropdown} />}
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <Footprints size={20} aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-bold text-primary-dark">
            Stronger<span className="text-accent-dark">Steps</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.href || link.label} link={link} pathname={pathname} />
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href="/join" variant="primary">
            Join Our Community
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-primary-dark lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-line/70 bg-bg lg:hidden max-h-[80vh] overflow-y-auto"
          aria-label="Primary"
        >
          <div className="flex flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              const expanded = mobileExpanded === (link.href || link.label);

              if (!link.dropdown) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-3 py-3 font-display text-base font-semibold transition-colors ${
                      active ? 'bg-sage text-primary-dark' : 'text-ink/80 hover:bg-sage/60'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                );
              }

              return (
                <div key={link.label}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 font-display text-base font-semibold transition-colors ${
                      expanded ? 'bg-sage text-primary-dark' : 'text-ink/80 hover:bg-sage/60'
                    }`}
                    onClick={() => setMobileExpanded(expanded ? null : (link.href || link.label))}
                    aria-expanded={expanded}
                  >
                    {link.label}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {expanded && (
                    <div className="ml-3 mt-1 border-l-2 border-primary/20 pl-3 flex flex-col gap-1">
                      {link.dropdown.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/80 hover:bg-sage/60 hover:text-primary-dark transition-colors"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon size={13} />
                            </span>
                            <span>
                              <span className="block font-semibold">{item.label}</span>
                              <span className="block text-xs text-muted">{item.desc}</span>
                            </span>
                          </Link>
                        );
                      })}
                      <Link
                        href={link.href}
                        className="mt-1 mb-2 rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:underline"
                      >
                        View all in {link.label} →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-3 px-1">
              <Button href="/join" variant="primary" className="w-full">
                Join Our Community
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
