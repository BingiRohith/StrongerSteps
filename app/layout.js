import './globals.css';
import ConditionalChrome from '@/components/ConditionalChrome';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_TITLE = 'Stronger Steps | Healthy Aging for Adults 50+';
const SITE_DESCRIPTION =
  'Helping adults 50+ stay strong, independent, and confident through exercise, nutrition, education, and community. Small steps. Stronger years.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | Stronger Steps',
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: 'Stronger Steps',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body bg-bg text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <ConditionalChrome>{children}</ConditionalChrome>
      </body>
    </html>
  );
}
