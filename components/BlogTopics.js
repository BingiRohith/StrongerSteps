'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  MoveUp,
  MapPin,
  PersonStanding,
  BatteryLow,
  ShieldAlert,
  Dumbbell,
  Plane,
  Users,
  Footprints,
  Star,
  HeartHandshake,
  Activity,
  Zap,
  HeartPulse,
} from 'lucide-react';

const TOPICS = [
  { name: 'Climbing Stairs', icon: MoveUp },
  { name: 'Walking Long Distances', icon: MapPin },
  { name: 'Joint Pains', icon: PersonStanding },
  { name: 'Low Energy', icon: BatteryLow },
  { name: 'Balance', icon: ShieldAlert },
  { name: 'Exercise', icon: Dumbbell },
  { name: 'Travel', icon: Plane },
  { name: 'Social Activities', icon: Users },
  { name: 'Going Out Alone', icon: Footprints },
  { name: 'Strength', icon: Activity },
  { name: 'Confidence', icon: Star },
  { name: 'Social Life', icon: HeartHandshake },
  { name: 'Independence', icon: Zap },
  { name: 'Painless Working', icon: HeartPulse },
  { name: 'Disease-Free Life', icon: Activity },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function BlogTopics() {
  const [query, setQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState(null);

  const availableLetters = useMemo(
    () => new Set(TOPICS.map((t) => t.name.charAt(0).toUpperCase())),
    []
  );

  const filtered = useMemo(() => {
    if (activeLetter) {
      return TOPICS.filter((t) => t.name.toUpperCase().startsWith(activeLetter));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return TOPICS.filter((t) => t.name.toLowerCase().includes(q));
    }
    return TOPICS;
  }, [query, activeLetter]);

  const activeFilterLabel = activeLetter || query.trim();

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="relative w-full md:max-w-sm">
          <span className="sr-only">Search topics</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveLetter(null);
            }}
            placeholder="Search topics (e.g. Balance, Travel...)"
            className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-1" role="group" aria-label="Jump to letter">
          {ALPHABET.map((letter) => {
            const has = availableLetters.has(letter);
            const active = activeLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                disabled={!has}
                aria-pressed={active}
                onClick={() => {
                  setQuery('');
                  setActiveLetter((prev) => (prev === letter ? null : letter));
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : has
                    ? 'bg-white text-primary-dark hover:bg-primary hover:text-white'
                    : 'cursor-default text-line'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {activeFilterLabel && (
        <p className="mt-3 text-sm text-muted">
          {filtered.length
            ? `Showing ${filtered.length} topic${filtered.length === 1 ? '' : 's'} for \u201c${activeFilterLabel}\u201d`
            : `No topics found for \u201c${activeFilterLabel}\u201d`}
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveLetter(null);
            }}
            className="ml-2 font-semibold text-primary underline"
          >
            Clear
          </button>
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map(({ name, icon: Icon }) => (
          <div
            key={name}
            className="flex items-center gap-3 rounded-xl2 border border-line bg-white p-4 cursor-pointer hover:border-primary hover:bg-sage transition-colors"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-primary">
              <Icon size={18} aria-hidden="true" />
            </span>
            <span className="font-display text-sm font-semibold text-primary-dark">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
