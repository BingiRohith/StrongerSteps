'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Footprints,
  LayoutDashboard,
  Newspaper,
  Image as ImageIcon,
  Users,
  Package,
  CreditCard,
  Calendar,
  FolderTree,
  Soup,
  Tags,
  X,
} from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/blogs', label: 'Blogs', icon: Newspaper },
  { href: '/admin/infographics', label: 'Infographics', icon: ImageIcon },
  { href: '/admin/team', label: 'Team', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/membership', label: 'Membership', icon: CreditCard },
  { href: '/admin/events', label: 'Programs', icon: Calendar },
  { href: '/admin/recipes', label: 'Recipes', icon: Soup },
  { href: '/admin/recipe-categories', label: 'Recipe Categories', icon: Tags },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
];

function NavLink({ href, label, icon: Icon, active, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold font-display transition-colors duration-150 ${
        active
          ? 'bg-accent text-primary-dark'
          : 'text-sage/80 hover:bg-white/10 hover:text-white'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        size={18}
        strokeWidth={2.25}
        className={active ? 'text-primary-dark' : 'text-sage/60 group-hover:text-white'}
      />
      {label}
    </Link>
  );
}

/**
 * Sidebar content, shared between the fixed desktop rail and the mobile
 * slide-over. `onNavigate` lets the mobile drawer close itself on tap.
 */
function SidebarContent({ pathname, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary-dark">
          <Footprints size={18} strokeWidth={2.5} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-white">Stronger Steps</p>
          <p className="text-xs text-sage/60">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="px-6 py-5 text-xs text-sage/50">
        &copy; {new Date().getFullYear()} Stronger Steps
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:bg-primary-dark">
      <SidebarContent pathname={pathname} />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/50 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        className={`absolute inset-y-0 left-0 flex w-64 flex-col bg-primary-dark shadow-xl transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-4 rounded-full p-1.5 text-sage/70 hover:bg-white/10 hover:text-white"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        <SidebarContent pathname={pathname} onNavigate={onClose} />
      </aside>
    </div>
  );
}
