'use client';

import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';
import { ICON_OPTIONS, getIcon } from '@/lib/homepageIcons';

const EMPTY_ICON_CARD = { icon: 'Star', title: '', description: '', active: true };
const EMPTY_IMAGE_CARD = {
  image: { url: '', alt: '' },
  title: '',
  description: '',
  ctaLabel: '',
  ctaUrl: '',
  active: true,
};

/**
 * Shared add/edit/delete/reorder/active-toggle list editor for the
 * homepage's card-style sections (Why It Matters points, Vision pillars,
 * What We Do cards) — same shape of concerns as
 * components/admin/membership/BenefitsEditor.js, generalized to full card
 * objects with two variants: an icon picker (`variant="icon"`) or an image
 * upload + optional CTA (`variant="image"`). Count is fully dynamic; the
 * public homepage renders however many `active` items exist, in list order.
 */
export default function CardListEditor({ items, onChange, variant = 'icon', uploadUrl }) {
  const cards = items || [];

  function update(index, patch) {
    onChange(cards.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function removeAt(index) {
    onChange(cards.filter((_, i) => i !== index));
  }

  function moveAt(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= cards.length) return;
    const next = [...cards];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addCard() {
    onChange([...cards, variant === 'icon' ? { ...EMPTY_ICON_CARD } : { ...EMPTY_IMAGE_CARD }]);
  }

  return (
    <div className="space-y-4">
      {cards.length === 0 && (
        <p className="text-sm text-muted">No items yet. Add the first one below.</p>
      )}

      {cards.map((card, index) => {
        const Icon = variant === 'icon' ? getIcon(card.icon) : null;
        return (
          // eslint-disable-next-line react/no-array-index-key -- cards are plain objects with no stable id
          <div key={index} className="rounded-xl2 border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage font-display text-xs font-bold text-primary-dark">
                  {index + 1}
                </span>
                {!card.active && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-dark">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveAt(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                  className="rounded-lg p-1.5 text-muted hover:bg-sage disabled:opacity-30"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => moveAt(index, 1)}
                  disabled={index === cards.length - 1}
                  title="Move down"
                  className="rounded-lg p-1.5 text-muted hover:bg-sage disabled:opacity-30"
                >
                  <ChevronDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => update(index, { active: !card.active })}
                  title={card.active ? 'Deactivate' : 'Activate'}
                  className="rounded-lg p-1.5 text-primary-dark hover:bg-sage"
                >
                  {card.active ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  title="Delete"
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {variant === 'icon' ? (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-ink">Icon</label>
                <select
                  value={card.icon}
                  onChange={(e) => update(index, { icon: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {ICON_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {Icon && <Icon size={20} className="mt-2 text-primary" aria-hidden="true" />}
              </div>
            ) : (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-ink">Image</label>
                <div className="mt-1">
                  <ImageUploadField
                    value={card.image}
                    onChange={(image) => update(index, { image })}
                    heightClass="h-32"
                    uploadUrl={uploadUrl}
                  />
                </div>
              </div>
            )}

            <label className="mt-3 block text-xs font-semibold text-ink">Title</label>
            <input
              type="text"
              value={card.title}
              onChange={(e) => update(index, { title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <label className="mt-3 block text-xs font-semibold text-ink">Description</label>
            <textarea
              rows={2}
              value={card.description}
              onChange={(e) => update(index, { description: e.target.value })}
              className="mt-1 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {variant === 'image' && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink">
                    CTA label <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={card.ctaLabel}
                    onChange={(e) => update(index, { ctaLabel: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink">
                    CTA URL <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={card.ctaUrl}
                    onChange={(e) => update(index, { ctaUrl: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addCard}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary"
      >
        <Plus size={14} />
        Add item
      </button>
    </div>
  );
}
