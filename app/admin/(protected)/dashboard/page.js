import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import Booking from '@/models/Booking';
import {
  Newspaper,
  Image as ImageIcon,
  Users,
  Package,
  CreditCard,
  Calendar,
  Ticket,
  Home,
  Tags,
  Soup,
  GraduationCap,
  Library,
  Images,
  Wrench,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const CARDS = [
  { label: 'Homepage', description: 'Edit hero, cards and sections', icon: Home, href: '/admin/homepage' },
  { label: 'Blogs', description: 'Write, publish and organize articles', icon: Newspaper, href: '/admin/blogs' },
  { label: 'Blog Categories', description: 'Organize articles by topic', icon: Tags, href: '/admin/categories' },
  { label: 'Infographics', description: 'Manage previews and protected downloads', icon: ImageIcon, href: '/admin/infographics' },
  { label: 'Team', description: 'Manage the public team directory', icon: Users, href: '/admin/team' },
  { label: 'Products', description: 'Manage products, pricing and availability', icon: Package, href: '/admin/products' },
  { label: 'Product Categories', description: 'Organize the product catalogue', icon: Tags, href: '/admin/product-categories' },
  { label: 'Membership', description: 'Manage membership plans and benefits', icon: CreditCard, href: '/admin/membership' },
  { label: 'Programs', description: 'Manage events, dates and capacity', icon: Calendar, href: '/admin/events' },
  { label: 'Bookings', description: 'Review bookings and update their status', icon: Ticket, href: '/admin/bookings' },
  { label: 'Recipes', description: 'Publish recipes and nutrition information', icon: Soup, href: '/admin/recipes' },
  { label: 'Recipe Categories', description: 'Organize the recipe library', icon: Tags, href: '/admin/recipe-categories' },
  { label: 'Courses', description: 'Build courses, sections and lessons', icon: GraduationCap, href: '/admin/courses' },
  { label: 'Course Categories', description: 'Organize the course catalogue', icon: Tags, href: '/admin/course-categories' },
  { label: 'Resources', description: 'Manage protected files and downloads', icon: Library, href: '/admin/resources' },
  { label: 'Media Library', description: 'Upload, reuse and protect shared images', icon: Images, href: '/admin/media' },
  { label: 'Resource Categories', description: 'Organize the resource library', icon: Tags, href: '/admin/resource-categories' },
  { label: 'Tools', description: 'Build assessments and scoring rules', icon: Wrench, href: '/admin/tools' },
  { label: 'Tool Categories', description: 'Organize assessments and calculators', icon: Tags, href: '/admin/tool-categories' },
];

const STAT_LABELS = {
  totalEvents: 'Total Events',
  upcomingEvents: 'Upcoming Events',
  activeEvents: 'Active Events',
  bookingsCount: 'Bookings Count',
  pendingBookings: 'Pending Bookings',
  confirmedBookings: 'Confirmed Bookings',
  cancelledBookings: 'Cancelled Bookings',
};

async function getProgramsStats() {
  await connectDB();
  const now = new Date();

  const [
    totalEvents,
    upcomingEvents,
    activeEvents,
    bookingsCount,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
  ] = await Promise.all([
    Event.countDocuments({}),
    Event.countDocuments({ status: 'published', eventDate: { $gte: now } }),
    Event.countDocuments({ status: 'published' }),
    Booking.countDocuments({}),
    Booking.countDocuments({ bookingStatus: 'pending' }),
    Booking.countDocuments({ bookingStatus: 'confirmed' }),
    Booking.countDocuments({ bookingStatus: 'cancelled' }),
  ]);

  return {
    totalEvents,
    upcomingEvents,
    activeEvents,
    bookingsCount,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
  };
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
          Manage the Stronger Steps website, learning content, memberships, programmes,
          bookings, resources and assessment tools from one place.
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
        {CARDS.map(({ label, description, icon: Icon, href }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl2 border border-line bg-surface p-5 transition-colors duration-150 hover:border-primary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark group-hover:bg-accent-soft">
              <Icon size={18} />
            </span>
            <p className="mt-4 font-display text-sm font-semibold text-ink">{label}</p>
            <p className="mt-1 text-xs text-muted">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
