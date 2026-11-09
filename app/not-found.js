import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-primary">
        <Compass size={26} aria-hidden="true" />
      </span>
      <h1 className="font-display text-2xl font-bold text-primary-dark md:text-3xl">
        We couldn&apos;t find that page
      </h1>
      <p className="max-w-md text-muted">
        The page you&apos;re looking for may have moved or no longer exists. Let&apos;s get you
        back on track.
      </p>
      <Button href="/" variant="primary" className="mt-2">
        Back to Home
      </Button>
    </div>
  );
}
