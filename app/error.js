'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Root error boundary — catches any unhandled render/data error under the
 * public site (Next.js requires this to be a Client Component). Logged
 * client-side only; the server-side error itself is already logged by
 * lib/apiResponse.js's withErrorHandling for API routes.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-primary">
        <AlertTriangle size={26} aria-hidden="true" />
      </span>
      <h1 className="font-display text-2xl font-bold text-primary-dark md:text-3xl">
        Something went wrong
      </h1>
      <p className="max-w-md text-muted">
        We hit an unexpected error loading this page. Please try again — if the problem
        continues, come back a little later.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <Button href="/" variant="outline">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
