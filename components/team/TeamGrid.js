'use client';

import { useCallback, useRef, useState } from 'react';
import { Search, Users, Loader2, Mail, Phone, Linkedin, Twitter, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * Sprint 19.4 — the About page's team section, replacing the illustrated
 * Organization Tree (components/team/OrgTree.js and friends, deleted) with
 * a flat responsive card grid per client instruction: no tree diagrams, org
 * charts, parent-child layouts, or connector lines. Server-rendered with the
 * initial published roster (no HTTP round trip for first paint, same
 * pattern OrgTree used), then re-fetches `/api/team` only when the visitor
 * searches.
 */

function initial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export default function TeamGrid({ initialMembers }) {
  const [members, setMembers] = useState(initialMembers || []);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/team?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.teamMembers);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearchChange(e) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  }

  return (
    <div>
      <label className="relative mx-auto block w-full max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search by name, department or position…"
          className="w-full rounded-full border border-line bg-white py-2.5 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        )}
      </label>

      {members.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Users size={20} />
          </span>
          <p className="font-display text-sm font-semibold text-ink">
            {query.trim() ? 'No team members match your search' : 'Team coming soon'}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <TeamMemberCard key={member._id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamMemberCard({ member }) {
  const social = member.social || {};
  const contact = member.contact || {};
  const hasLinks = social.linkedin || social.twitter || contact.email || contact.phone;

  return (
    <div className="flex h-full flex-col rounded-xl2 border border-line bg-white p-6 text-center">
      {member.photo?.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
        <img
          src={member.photo.url}
          alt={member.photo.alt || member.name}
          className="mx-auto h-24 w-24 shrink-0 rounded-full border-2 border-white object-cover shadow-md"
        />
      ) : (
        <span className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-white bg-sage font-display text-2xl font-bold text-primary-dark shadow-md">
          {initial(member.name)}
        </span>
      )}

      <h3 className="mt-4 font-display text-base font-bold text-primary-dark">{member.name}</h3>
      {member.designation && <p className="mt-0.5 text-sm text-muted">{member.designation}</p>}
      {member.department && (
        <span className="mt-2 inline-flex justify-center">
          <Badge tone="sage">{member.department}</Badge>
        </span>
      )}

      {member.experience && (
        <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-dark">
          <Briefcase size={13} aria-hidden="true" />
          {member.experience}
        </p>
      )}

      {member.specialization?.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {member.specialization.map((spec) => (
            <span key={spec} className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold text-primary-dark">
              {spec}
            </span>
          ))}
        </div>
      )}

      {member.qualifications?.length > 0 && (
        <p className="mt-3 text-xs text-muted">{member.qualifications.join(' · ')}</p>
      )}

      {member.bio && <p className="mt-3 flex-1 text-sm leading-relaxed text-ink line-clamp-4">{member.bio}</p>}

      {hasLinks && (
        <div className="mt-4 flex items-center justify-center gap-2 border-t border-line pt-4">
          {social.linkedin && (
            <a
              href={social.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label={`${member.name} on LinkedIn`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-primary-dark transition-colors hover:bg-primary hover:text-white"
            >
              <Linkedin size={14} />
            </a>
          )}
          {social.twitter && (
            <a
              href={social.twitter}
              target="_blank"
              rel="noreferrer"
              aria-label={`${member.name} on Twitter`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-primary-dark transition-colors hover:bg-primary hover:text-white"
            >
              <Twitter size={14} />
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              aria-label={`Email ${member.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-primary-dark transition-colors hover:bg-primary hover:text-white"
            >
              <Mail size={14} />
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              aria-label={`Call ${member.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-primary-dark transition-colors hover:bg-primary hover:text-white"
            >
              <Phone size={14} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
