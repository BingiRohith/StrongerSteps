import { User, Mail, Phone } from 'lucide-react';

export default function ProfileCard({ lead }) {
  return (
    <div className="rounded-xl2 border border-line bg-white p-6">
      <div className="flex items-center gap-2 text-primary-dark">
        <User size={18} aria-hidden="true" />
        <h2 className="font-display text-base font-bold">Profile</h2>
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Name</dt>
          <dd className="font-semibold text-ink">{lead.name || '—'}</dd>
        </div>
        {lead.email && (
          <div className="flex items-start gap-2">
            <Mail size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
            <dd className="text-ink">{lead.email}</dd>
          </div>
        )}
        {lead.mobile && (
          <div className="flex items-start gap-2">
            <Phone size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
            <dd className="text-ink">{lead.mobile}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
