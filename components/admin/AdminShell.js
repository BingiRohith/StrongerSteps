'use client';

import { useState } from 'react';
import { DesktopSidebar, MobileSidebar } from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell({ user, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg font-body text-ink antialiased">
      <DesktopSidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-64">
        <AdminHeader user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
