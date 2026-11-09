'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import MembersOnlyDialog from './MembersOnlyDialog';

/**
 * Sprint 19.7a — small reusable trigger button that opens
 * MembersOnlyDialog, for otherwise-server-rendered locked-content panels
 * (e.g. the lesson page's LockedLessonPanel) that don't need their own
 * client-side state beyond "is this dialog open."
 */
export default function MembersOnlyTrigger({ label = 'Login' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
      >
        <ShieldCheck size={15} aria-hidden="true" />
        {label}
      </button>
      {open && <MembersOnlyDialog onClose={() => setOpen(false)} onLoggedIn={() => router.refresh()} />}
    </>
  );
}
