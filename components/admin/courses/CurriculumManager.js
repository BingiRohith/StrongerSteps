'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  GripVertical,
  Lock,
  Eye,
} from 'lucide-react';
import LessonEditorPanel from './LessonEditorPanel';
import { lessonTypeLabel } from '@/lib/courseOptions';

/**
 * Sections + Lessons management for one course — the Course → Section →
 * Lesson hierarchy's admin surface. Sections are always fully loaded on
 * mount; each section's lessons are fetched lazily the first time it's
 * expanded (kept simple rather than fetching every lesson for every
 * section upfront, since a course could have many sections).
 */
export default function CurriculumManager({ courseId }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [lessonsBySection, setLessonsBySection] = useState({});
  const [lessonsLoading, setLessonsLoading] = useState({});
  const [busy, setBusy] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null); // { sectionId, lesson }
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionDraft, setSectionDraft] = useState({});

  const loadSections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load sections');
        return;
      }
      setSections(data.sections);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  async function loadLessons(sectionId) {
    setLessonsLoading((prev) => ({ ...prev, [sectionId]: true }));
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLessonsBySection((prev) => ({ ...prev, [sectionId]: data.lessons }));
      }
    } finally {
      setLessonsLoading((prev) => ({ ...prev, [sectionId]: false }));
    }
  }

  function toggleExpand(section) {
    const isOpen = expanded[section._id];
    setExpanded((prev) => ({ ...prev, [section._id]: !isOpen }));
    if (!isOpen && !lessonsBySection[section._id]) loadLessons(section._id);
  }

  async function addSection() {
    if (!newSectionTitle.trim()) return;
    setAddingSection(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSectionTitle, displayOrder: sections.length }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSections((prev) => [...prev, data.section]);
        setNewSectionTitle('');
      } else {
        setError(data.error || 'Failed to add section');
      }
    } finally {
      setAddingSection(false);
    }
  }

  async function saveSection(sectionId, body) {
    const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) return data.section;
    return null;
  }

  async function moveSection(section, direction) {
    const sorted = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((s) => s._id === section._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const neighbor = sorted[targetIndex];

    setBusy(section._id);
    try {
      const [updated, updatedNeighbor] = await Promise.all([
        saveSection(section._id, { displayOrder: neighbor.displayOrder }),
        saveSection(neighbor._id, { displayOrder: section.displayOrder }),
      ]);
      if (updated && updatedNeighbor) {
        setSections((prev) =>
          prev.map((s) => {
            if (s._id === updated._id) return updated;
            if (s._id === updatedNeighbor._id) return updatedNeighbor;
            return s;
          })
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteSection(section) {
    if (!confirm(`Delete "${section.title}" and all of its lessons?`)) return;
    setBusy(section._id);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${section._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSections((prev) => prev.filter((s) => s._id !== section._id));
      }
    } finally {
      setBusy(null);
    }
  }

  async function addLesson(sectionId) {
    const title = prompt('Lesson title:');
    if (!title?.trim()) return;
    setBusy(sectionId);
    try {
      const lessons = lessonsBySection[sectionId] || [];
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, displayOrder: lessons.length }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLessonsBySection((prev) => ({ ...prev, [sectionId]: [...lessons, data.lesson] }));
        setEditingLesson({ sectionId, lesson: data.lesson });
      } else {
        setError(data.error || 'Failed to add lesson');
      }
    } finally {
      setBusy(null);
    }
  }

  async function moveLesson(sectionId, lesson, direction) {
    const lessons = [...(lessonsBySection[sectionId] || [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = lessons.findIndex((l) => l._id === lesson._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;
    const neighbor = lessons[targetIndex];

    setBusy(lesson._id);
    try {
      const basePath = `/api/admin/courses/${courseId}/sections/${sectionId}/lessons`;
      const [resA, resB] = await Promise.all([
        fetch(`${basePath}/${lesson._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: neighbor.displayOrder }),
        }),
        fetch(`${basePath}/${neighbor._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: lesson.displayOrder }),
        }),
      ]);
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
      if (dataA.success && dataB.success) {
        setLessonsBySection((prev) => ({
          ...prev,
          [sectionId]: prev[sectionId].map((l) => {
            if (l._id === dataA.lesson._id) return dataA.lesson;
            if (l._id === dataB.lesson._id) return dataB.lesson;
            return l;
          }),
        }));
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteLesson(sectionId, lesson) {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    setBusy(lesson._id);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lesson._id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setLessonsBySection((prev) => ({
          ...prev,
          [sectionId]: prev[sectionId].filter((l) => l._id !== lesson._id),
        }));
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 size={18} className="animate-spin" />
        Loading curriculum…
      </div>
    );
  }

  const sortedSections = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div>
      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="space-y-3">
        {sortedSections.map((section, index) => {
          const isOpen = Boolean(expanded[section._id]);
          const lessons = [...(lessonsBySection[section._id] || [])].sort(
            (a, b) => a.displayOrder - b.displayOrder
          );

          return (
            <div key={section._id} className="overflow-hidden rounded-xl2 border border-line bg-surface">
              <div className="flex items-center gap-2 px-4 py-3">
                <GripVertical size={16} className="shrink-0 text-muted" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => toggleExpand(section)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  {editingSectionId === section._id ? (
                    <input
                      type="text"
                      value={sectionDraft.title ?? section.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSectionDraft({ ...sectionDraft, title: e.target.value })}
                      className="rounded border border-line px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="font-display text-sm font-semibold text-ink">{section.title}</span>
                  )}
                  <span className="text-xs text-muted">
                    ({lessons.length || (lessonsBySection[section._id] ? 0 : '…')} lessons)
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(section, -1)}
                    disabled={busy === section._id || index === 0}
                    className="rounded-lg p-1.5 text-muted hover:bg-sage disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(section, 1)}
                    disabled={busy === section._id || index === sortedSections.length - 1}
                    className="rounded-lg p-1.5 text-muted hover:bg-sage disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                  {editingSectionId === section._id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await saveSection(section._id, sectionDraft);
                        if (updated) setSections((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
                        setEditingSectionId(null);
                        setSectionDraft({});
                      }}
                      className="rounded-lg p-1.5 text-primary hover:bg-sage"
                      title="Save"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSectionId(section._id);
                        setSectionDraft({ title: section.title, description: section.description });
                      }}
                      className="rounded-lg p-1.5 text-primary-dark hover:bg-sage"
                      title="Edit section"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteSection(section)}
                    disabled={busy === section._id}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    title="Delete section"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-line bg-bg/60 px-4 py-3">
                  {lessonsLoading[section._id] ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      Loading lessons…
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {lessons.map((lesson, lessonIndex) => (
                        <li key={lesson._id} className="rounded-lg border border-line bg-white p-3">
                          <div className="flex items-center gap-2">
                            <span className="flex-1 truncate text-sm font-semibold text-ink">{lesson.title}</span>
                            <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-dark">
                              {lessonTypeLabel(lesson.lessonType)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-muted">
                              {lesson.previewAvailable ? <Eye size={11} /> : <Lock size={11} />}
                              {lesson.accessLevel}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveLesson(section._id, lesson, -1)}
                              disabled={busy === lesson._id || lessonIndex === 0}
                              className="rounded p-1 text-muted hover:bg-sage disabled:opacity-30"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveLesson(section._id, lesson, 1)}
                              disabled={busy === lesson._id || lessonIndex === lessons.length - 1}
                              className="rounded p-1 text-muted hover:bg-sage disabled:opacity-30"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingLesson(
                                  editingLesson?.lesson._id === lesson._id ? null : { sectionId: section._id, lesson }
                                )
                              }
                              className="rounded p-1 text-primary-dark hover:bg-sage"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteLesson(section._id, lesson)}
                              disabled={busy === lesson._id}
                              className="rounded p-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {editingLesson?.lesson._id === lesson._id && (
                            <LessonEditorPanel
                              courseId={courseId}
                              sectionId={section._id}
                              lesson={editingLesson.lesson}
                              onSaved={(updated) => {
                                setLessonsBySection((prev) => ({
                                  ...prev,
                                  [section._id]: prev[section._id].map((l) =>
                                    l._id === updated._id ? updated : l
                                  ),
                                }));
                                setEditingLesson(null);
                              }}
                              onClose={() => setEditingLesson(null)}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    onClick={() => addLesson(section._id)}
                    disabled={busy === section._id}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary disabled:opacity-60"
                  >
                    <Plus size={13} />
                    Add lesson
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title (e.g. Week 1: Foundations)"
          className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={addSection}
          disabled={addingSection || !newSectionTitle.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {addingSection ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add section
        </button>
      </div>

      {sortedSections.length === 0 && (
        <p className="mt-4 text-sm text-muted">No sections yet. Add the first one above.</p>
      )}
    </div>
  );
}
