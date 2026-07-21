'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Plus, Trash2, Pencil, Loader2, Lock, Eye, Download } from 'lucide-react';
import ResourceFileEditorPanel from './ResourceFileEditorPanel';
import { FILE_TYPES, fileTypeLabel } from '@/lib/resourceOptions';

/**
 * Files management for one resource — the flat Resource -> ResourceFile
 * tier's admin surface (no Section-style middle grouping, unlike
 * CurriculumManager.js's Course -> Section -> Lesson). Mirrors
 * CurriculumManager.js's row/reorder/inline-edit pattern, flattened to a
 * single list.
 */
export default function ResourceFilesManager({ resourceId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [editingFileId, setEditingFileId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newFileType, setNewFileType] = useState('pdf');
  const [adding, setAdding] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/resources/${resourceId}/files`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load files');
        return;
      }
      setFiles(data.files);
    } finally {
      setLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function saveFile(fileId, body) {
    const res = await fetch(`/api/admin/resources/${resourceId}/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) return data.file;
    return null;
  }

  async function addFile() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/resources/${resourceId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, fileType: newFileType, displayOrder: files.length }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles((prev) => [...prev, data.file]);
        setNewTitle('');
        setEditingFileId(data.file._id);
      } else {
        setError(data.error || 'Failed to add file');
      }
    } finally {
      setAdding(false);
    }
  }

  async function move(file, direction) {
    const sorted = [...files].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((f) => f._id === file._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const neighbor = sorted[targetIndex];

    setBusy(file._id);
    try {
      const [updated, updatedNeighbor] = await Promise.all([
        saveFile(file._id, { displayOrder: neighbor.displayOrder }),
        saveFile(neighbor._id, { displayOrder: file.displayOrder }),
      ]);
      if (updated && updatedNeighbor) {
        setFiles((prev) =>
          prev.map((f) => {
            if (f._id === updated._id) return updated;
            if (f._id === updatedNeighbor._id) return updatedNeighbor;
            return f;
          })
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteFile(file) {
    if (!confirm(`Delete "${file.title}"?`)) return;
    setBusy(file._id);
    try {
      const res = await fetch(`/api/admin/resources/${resourceId}/files/${file._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 size={18} className="animate-spin" />
        Loading files…
      </div>
    );
  }

  const sortedFiles = [...files].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div>
      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="space-y-3">
        {sortedFiles.map((file, index) => (
          <div key={file._id} className="overflow-hidden rounded-xl2 border border-line bg-surface">
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <span className="flex-1 truncate text-sm font-semibold text-ink">{file.title}</span>
              <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-dark">
                {fileTypeLabel(file.fileType)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-muted">
                {file.previewAvailable ? <Eye size={11} /> : <Lock size={11} />}
                {file.accessLevel}
              </span>
              {file.downloadable !== false && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-muted">
                  <Download size={11} />
                </span>
              )}
              <button
                type="button"
                onClick={() => move(file, -1)}
                disabled={busy === file._id || index === 0}
                className="rounded p-1 text-muted hover:bg-sage disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => move(file, 1)}
                disabled={busy === file._id || index === sortedFiles.length - 1}
                className="rounded p-1 text-muted hover:bg-sage disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => setEditingFileId(editingFileId === file._id ? null : file._id)}
                className="rounded p-1 text-primary-dark hover:bg-sage"
                title="Edit file"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => deleteFile(file)}
                disabled={busy === file._id}
                className="rounded p-1 text-red-600 hover:bg-red-50"
                title="Delete file"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {editingFileId === file._id && (
              <div className="border-t border-line bg-bg/60 px-4 py-3">
                <ResourceFileEditorPanel
                  resourceId={resourceId}
                  file={file}
                  onSaved={(updated) => {
                    setFiles((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
                    setEditingFileId(null);
                  }}
                  onClose={() => setEditingFileId(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New file title (e.g. Exercise Checklist)"
          className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={newFileType}
          onChange={(e) => setNewFileType(e.target.value)}
          className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {FILE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addFile}
          disabled={adding || !newTitle.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add file
        </button>
      </div>

      {sortedFiles.length === 0 && (
        <p className="mt-4 text-sm text-muted">No files yet. Add the first one above.</p>
      )}
    </div>
  );
}
