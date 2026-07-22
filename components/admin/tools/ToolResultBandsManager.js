'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Sigma, Trash2 } from 'lucide-react';

/**
 * Scoring Rules + Recommendation Builder for one tool, combined into a
 * single flat CRUD list (see models/ToolResultBand.js's header comment for
 * why these two brief items share one model). A tool typically has only a
 * handful of score bands (e.g. Low/Moderate/High risk), so this manages
 * them as always-expanded inline-editable cards rather than a
 * navigate-away create/edit form, unlike the paginated Tools list itself.
 */
export default function ToolResultBandsManager({ toolId }) {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [drafts, setDrafts] = useState({}); // bandId -> draft form state

  const loadBands = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/tools/${toolId}/result-bands`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load result bands');
        return;
      }
      setBands(data.resultBands);
      setDrafts(
        Object.fromEntries(
          data.resultBands.map((band) => [
            band._id,
            {
              minScore: band.minScore,
              maxScore: band.maxScore,
              label: band.label,
              description: band.description,
              recommendationsText: (band.recommendations || []).join('\n'),
            },
          ])
        )
      );
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    loadBands();
  }, [loadBands]);

  function updateDraft(bandId, field, value) {
    setDrafts((prev) => ({ ...prev, [bandId]: { ...prev[bandId], [field]: value } }));
  }

  async function addBand() {
    setBusyId('new');
    try {
      const res = await fetch(`/api/admin/tools/${toolId}/result-bands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'New band',
          minScore: 0,
          maxScore: 0,
          displayOrder: bands.length,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBands((prev) => [...prev, data.resultBand]);
        setDrafts((prev) => ({
          ...prev,
          [data.resultBand._id]: {
            minScore: data.resultBand.minScore,
            maxScore: data.resultBand.maxScore,
            label: data.resultBand.label,
            description: data.resultBand.description,
            recommendationsText: '',
          },
        }));
      } else {
        setError(data.error || 'Failed to add result band');
      }
    } finally {
      setBusyId(null);
    }
  }

  async function saveBand(bandId) {
    const draft = drafts[bandId];
    if (!draft) return;
    setBusyId(bandId);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}/result-bands/${bandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: draft.label,
          minScore: Number(draft.minScore) || 0,
          maxScore: Number(draft.maxScore) || 0,
          description: draft.description,
          recommendations: draft.recommendationsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBands((prev) => prev.map((b) => (b._id === bandId ? data.resultBand : b)));
      } else {
        setError(data.error || 'Failed to save result band');
      }
    } finally {
      setBusyId(null);
    }
  }

  async function deleteBand(band) {
    if (!confirm(`Delete "${band.label}"?`)) return;
    setBusyId(band._id);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}/result-bands/${band._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setBands((prev) => prev.filter((b) => b._id !== band._id));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 size={18} className="animate-spin" />
        Loading scoring rules…
      </div>
    );
  }

  const sortedBands = [...bands].sort((a, b) => a.minScore - b.minScore);

  return (
    <div>
      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      {sortedBands.length === 0 && (
        <div className="mb-4 flex flex-col items-center rounded-xl2 border border-line bg-surface px-6 py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Sigma size={20} />
          </span>
          <p className="font-display text-sm font-semibold text-ink">No scoring rules yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Add a score range (e.g. 0–3 = Low risk) with its recommendations.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sortedBands.map((band) => {
          const draft = drafts[band._id] || {};
          return (
            <div key={band._id} className="rounded-xl2 border border-line bg-surface p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-ink">Min score</label>
                  <input
                    type="number"
                    value={draft.minScore ?? 0}
                    onChange={(e) => updateDraft(band._id, 'minScore', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink">Max score</label>
                  <input
                    type="number"
                    value={draft.maxScore ?? 0}
                    onChange={(e) => updateDraft(band._id, 'maxScore', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-ink">Label</label>
                  <input
                    type="text"
                    value={draft.label || ''}
                    onChange={(e) => updateDraft(band._id, 'label', e.target.value)}
                    placeholder="e.g. Low risk"
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <label className="mt-3 block text-xs font-semibold text-ink">Description</label>
              <textarea
                rows={2}
                value={draft.description || ''}
                onChange={(e) => updateDraft(band._id, 'description', e.target.value)}
                placeholder="Shown to the visitor above the recommendations"
                className="mt-1 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <label className="mt-3 block text-xs font-semibold text-ink">Recommendations (one per line)</label>
              <textarea
                rows={4}
                value={draft.recommendationsText || ''}
                onChange={(e) => updateDraft(band._id, 'recommendationsText', e.target.value)}
                placeholder={'Review medications with your doctor\nInstall grab bars in the bathroom'}
                className="mt-1 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => deleteBand(band)}
                  disabled={busyId === band._id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => saveBand(band._id)}
                  disabled={busyId === band._id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {busyId === band._id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addBand}
        disabled={busyId === 'new'}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {busyId === 'new' ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        Add scoring rule
      </button>
    </div>
  );
}
