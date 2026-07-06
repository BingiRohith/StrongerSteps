'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, LogOut, Loader2 } from 'lucide-react';
import { NAV_ITEMS } from './AdminSidebar';

function currentTitle(pathname) {
  const match = NAV_ITEMS.find((item) => pathname === item.href);
  return match?.label || 'Admin';
}

export default function AdminHeader({ user, onMenuClick }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-primary-dark hover:bg-sage lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-bold text-primary-dark sm:text-xl">
          {currentTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden text-right sm:block">
          <p className="font-display text-sm font-semibold text-ink">{user?.name}</p>
          <p className="text-xs capitalize text-muted">{user?.role}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage font-display text-sm font-bold text-primary-dark">
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-4 py-2 text-sm font-display font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-white disabled:opacity-60"
        >
          {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
