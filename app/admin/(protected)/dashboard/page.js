import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import Booking from '@/models/Booking';
import { Newspaper, Image as ImageIcon, Users, Package, CreditCard, Calendar, FolderTree, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CARDS = [
  { label: 'Homepage', icon: Home, href: '/admin/homepage' },
  { label: 'Blogs', icon: Newspaper, href: '/admin/blogs' },
  { label: 'Infographics', icon: ImageIcon, href: '/admin/infographics' },
  { label: 'Team', icon: Users, href: '/admin/team' },
  { label: 'Products', icon: Package, href: '/admin/products' },
  { label: 'Membership', icon: CreditCard, href: '/admin/membership' },
  { label: 'Programs', icon: Calendar, href: '/admin/events' },
  { label: 'Categories', icon: FolderTree, href: '/admin/categories' },
];

const STAT_LABELS = {
  totalEvents: 'Total Events',
  upcomingEvents: 'Upcoming Events',
  activeEvents: 'Active Events',
  bookingsCount: 'Bookings Count',
};

async function getProgramsStats() {
  await connectDB();
  const now = new Date();

  const [totalEvents, upcomingEvents, activeEvents, bookingsCount] = await Promise.all([
    Event.countDocuments({}),
    Event.countDocuments({ status: 'published', eventDate: { $gte: now } }),
    Event.countDocuments({ status: 'published' }),
    Booking.countDocuments({}),
  ]);

  return { totalEvents, upcomingEvents, activeEvents, bookingsCount };
}

export default async function AdminDashboardPage() {
  const [user, stats] = await Promise.all([getCurrentUser(), getProgramsStats()]);

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

      <div className="mt-6">
        <h3 className="font-display text-sm font-bold text-primary-dark">Programs overview</h3>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Object.entries(STAT_LABELS).map(([key, label]) => (
            <div key={key} className="rounded-xl2 border border-line bg-surface p-5">
              <p className="font-display text-2xl font-bold text-primary-dark">{stats[key]}</p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
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
            <p className="mt-1 text-xs text-muted">
              {label === 'Programs'
                ? 'Manage events & bookings'
                : label === 'Homepage'
                ? 'Edit hero, cards & sections'
                : 'Not yet available'}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
