import './globals.css';
import ConditionalChrome from '@/components/ConditionalChrome';

export const metadata = {
  title: 'Stronger Steps | Healthy Aging for Adults 50+',
  description:
    'Helping adults 50+ stay strong, independent, and confident through exercise, nutrition, education, and community. Small steps. Stronger years.',
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
