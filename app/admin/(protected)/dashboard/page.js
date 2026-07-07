import { getCurrentUser } from '@/lib/auth';
import { Newspaper, Image as ImageIcon, Users, Package, FolderTree } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CARDS = [
  { label: 'Blogs', icon: Newspaper, href: '/admin/blogs' },
  { label: 'Infographics', icon: ImageIcon, href: '/admin/infographics' },
  { label: 'Team', icon: Users, href: '/admin/team' },
  { label: 'Products', icon: Package, href: '/admin/products' },
  { label: 'Categories', icon: FolderTree, href: '/admin/categories' },
];

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <div className="rounded-xl2 border border-line bg-surface p-6 sm:p-8">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-accent-dark">
          Welcome back
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary-dark sm:text-3xl">
          {user?.name || 'Admin'}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          This is the Stronger Steps admin panel. Content tools for blogs, infographics, the team
          directory, and categories will land here in upcoming sprints.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(({ label, icon: Icon, href }) => (
          <a
            key={href}
            href={href}
            className="group rounded-xl2 border border-line bg-surface p-5 transition-colors duration-150 hover:border-primary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark group-hover:bg-accent-soft">
              <Icon size={18} />
            </span>
            <p className="mt-4 font-display text-sm font-semibold text-ink">{label}</p>
            <p className="mt-1 text-xs text-muted">Not yet available</p>
          </a>
        ))}
      </div>
    </div>
  );
}
