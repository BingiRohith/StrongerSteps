'use client';

import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Search, X } from 'lucide-react';

/** Shared chooser used by content forms so uploaded images become reusable. */
export default function MediaPickerDialog({ open, onClose, onSelect }) {
  const [media, setMedia] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setMedia(data.media);
    } catch (err) { setError('Could not load the media library.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (open) load(); }, [open, search]); // eslint-disable-line react-hooks/exhaustive-deps

  async function upload(file) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await fetch('/api/admin/media', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      onSelect({ url: data.media.url, alt: data.media.alt || '' }); onClose();
    } catch (err) { setError(err.message || 'Upload failed.'); }
    finally { setUploading(false); }
  }

  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label="Choose image from media library">
    <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-display text-xl font-bold text-primary-dark">Media library</h2><p className="text-xs text-muted">Choose an existing image or upload it once for reuse.</p></div><button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-sage/30" aria-label="Close media library"><X size={18} /></button></div>
      <div className="flex flex-wrap gap-3 border-b border-line p-4"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"><ImagePlus size={16} />{uploading ? 'Uploading…' : 'Upload new image'}<input className="hidden" disabled={uploading} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => upload(e.target.files?.[0])} /></label><label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 text-muted" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filename or alt text" className="w-full rounded-lg border border-line py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" /></label></div>
      {error && <p className="px-5 pt-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="grid max-h-[58vh] grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3 md:grid-cols-4">
        {loading ? <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : media.map((item) => <button key={item.id} type="button" onClick={() => { onSelect({ url: item.url, alt: item.alt || '' }); onClose(); }} className="overflow-hidden rounded-lg border border-line text-left hover:border-primary hover:ring-2 hover:ring-primary/20"><img src={item.url} alt={item.alt || ''} className="h-28 w-full object-cover" /><span className="block truncate p-2 text-xs font-semibold text-ink">{item.originalName || item.filename}</span>{item.legacy && <span className="block px-2 pb-2 text-[10px] text-muted">Existing upload</span>}</button>)}
        {!loading && !media.length && <p className="col-span-full py-12 text-center text-sm text-muted">No images found. Upload an image to add it to the library.</p>}
      </div>
    </div>
  </div>;
}
