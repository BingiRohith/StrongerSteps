'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Home, Loader2 } from 'lucide-react';

// Code-split per tab (Sprint 17 perf pass) — only one of these five section
// forms is ever mounted at a time (see `activeTab` below), but they were
// statically imported, so every tab's JS shipped on first load regardless of
// which one the admin opened. Dynamic import keeps that same one-tab-at-a-
// time behavior while only fetching the active tab's chunk.
function TabLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 size={18} className="animate-spin" />
      Loading…
    </div>
  );
}
const HeroSectionForm = dynamic(() => import('./HeroSectionForm'), { loading: TabLoading });
const IconSectionForm = dynamic(() => import('./IconSectionForm'), { loading: TabLoading });
const WhatWeDoSectionForm = dynamic(() => import('./WhatWeDoSectionForm'), { loading: TabLoading });
const MembershipCtaSectionForm = dynamic(() => import('./MembershipCtaSectionForm'), { loading: TabLoading });

const TABS = [
  { key: 'hero', label: 'Hero' },
  { key: 'whyItMatters', label: 'Why It Matters' },
  { key: 'vision', label: 'Our Vision' },
  { key: 'whatWeDo', label: 'What We Do' },
  { key: 'membershipCta', label: 'Membership CTA' },
];

export default function HomepageEditorClient() {
  const [homepage, setHomepage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('hero');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/admin/homepage');
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to load homepage content');
          return;
        }
        setHomepage(data.homepage);
      } catch (err) {
        setError('Failed to load homepage content. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveSection(section, sectionData) {
    const res = await fetch('/api/admin/homepage', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, data: sectionData }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setHomepage(data.homepage);
      return { ok: true };
    }
    return { ok: false, error: data.error || 'Something went wrong. Please try again.' };
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
          <Home size={18} />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-primary-dark">Homepage</h2>
          <p className="text-xs text-muted">
            Everything on the public homepage is editable here — no code changes needed.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Loader2 size={18} className="animate-spin" />
          Loading homepage content…
        </div>
      ) : error ? (
        <div className="mt-10 px-6 py-16 text-center text-sm text-red-600">{error}</div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-1 rounded-full bg-sage p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-dark text-white'
                    : 'text-primary-dark/70 hover:text-primary-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === 'hero' && (
              <HeroSectionForm data={homepage.hero} onSave={(d) => saveSection('hero', d)} />
            )}
            {activeTab === 'whyItMatters' && (
              <IconSectionForm
                label="Why It Matters"
                listKey="points"
                data={homepage.whyItMatters}
                onSave={(d) => saveSection('whyItMatters', d)}
              />
            )}
            {activeTab === 'vision' && (
              <IconSectionForm
                label="Our Vision"
                listKey="pillars"
                data={homepage.vision}
                onSave={(d) => saveSection('vision', d)}
              />
            )}
            {activeTab === 'whatWeDo' && (
              <WhatWeDoSectionForm
                data={homepage.whatWeDo}
                onSave={(d) => saveSection('whatWeDo', d)}
              />
            )}
            {activeTab === 'membershipCta' && (
              <MembershipCtaSectionForm
                data={homepage.membershipCta}
                onSave={(d) => saveSection('membershipCta', d)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
