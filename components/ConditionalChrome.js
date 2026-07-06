'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * The public site always renders inside Header/Footer. The admin panel
 * (/admin/*) has its own chrome (see components/admin/AdminShell.js) and
 * must not inherit the public Header/Footer.
 *
 * This is the only change made to the public site's rendering: markup and
 * behavior for every non-/admin route is unchanged (Header, <main
 * id="main-content">, Footer, in the same order as before).
 */
export default function ConditionalChrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
