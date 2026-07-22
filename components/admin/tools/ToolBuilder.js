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
} from 'lucide-react';
import QuestionEditorPanel from './QuestionEditorPanel';
import { questionTypeLabel } from '@/lib/toolOptions';

/**
 * Sections + Questions management for one tool — the Tool → ToolSection →
 * ToolQuestion hierarchy's admin surface. Mirrors
 * components/admin/courses/CurriculumManager.js's section/lesson pattern
 * exactly (lazy-loaded questions per section, inline add/edit/delete,
 * displayOrder-swap reordering), pointed at the Tools builder API instead
 * of Courses.
 */
export default function ToolBuilder({ toolId }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [questionsBySection, setQuestionsBySection] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState({});
  const [busy, setBusy] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null); // { sectionId, question }
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionDraft, setSectionDraft] = useState({});

  const loadSections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/tools/${toolId}/sections`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load sections');
        return;
      }
      setSections(data.sections);
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  async function loadQuestions(sectionId) {
    setQuestionsLoading((prev) => ({ ...prev, [sectionId]: true }));
    try {
      const res = await fetch(`/api/admin/tools/${toolId}/sections/${sectionId}/questions`);
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestionsBySection((prev) => ({ ...prev, [sectionId]: data.questions }));
      }
    } finally {
      setQuestionsLoading((prev) => ({ ...prev, [sectionId]: false }));
    }
  }

  function toggleExpand(section) {
    const isOpen = expanded[section._id];
    setExpanded((prev) => ({ ...prev, [section._id]: !isOpen }));
    if (!isOpen && !questionsBySection[section._id]) loadQuestions(section._id);
  }

  async function addSection() {
    if (!newSectionTitle.trim()) return;
    setAddingSection(true);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}/sections`, {
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
    const res = await fetch(`/api/admin/tools/${toolId}/sections/${sectionId}`, {
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
    if (!confirm(`Delete "${section.title}" and all of its questions?`)) return;
    setBusy(section._id);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}/sections/${section._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSections((prev) => prev.filter((s) => s._id !== section._id));
      }
    } finally {
      setBusy(null);
    }
  }

  async function addQuestion(sectionId) {
    const questionText = prompt('Question text:');
    if (!questionText?.trim()) return;
    setBusy(sectionId);
    try {
      const questions = questionsBySection[sectionId] || [];
      const res = await fetch(`/api/admin/tools/${toolId}/sections/${sectionId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText, displayOrder: questions.length }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestionsBySection((prev) => ({ ...prev, [sectionId]: [...questions, data.question] }));
        setEditingQuestion({ sectionId, question: data.question });
      } else {
        setError(data.error || 'Failed to add question');
      }
    } finally {
      setBusy(null);
    }
  }

  async function moveQuestion(sectionId, question, direction) {
    const questions = [...(questionsBySection[sectionId] || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const index = questions.findIndex((q) => q._id === question._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const neighbor = questions[targetIndex];

    setBusy(question._id);
    try {
      const basePath = `/api/admin/tools/${toolId}/sections/${sectionId}/questions`;
      const [resA, resB] = await Promise.all([
        fetch(`${basePath}/${question._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: neighbor.displayOrder }),
        }),
        fetch(`${basePath}/${neighbor._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: question.displayOrder }),
        }),
      ]);
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
      if (dataA.success && dataB.success) {
        setQuestionsBySection((prev) => ({
          ...prev,
          [sectionId]: prev[sectionId].map((q) => {
            if (q._id === dataA.question._id) return dataA.question;
            if (q._id === dataB.question._id) return dataB.question;
            return q;
          }),
        }));
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteQuestion(sectionId, question) {
    if (!confirm(`Delete question "${question.questionText}"?`)) return;
    setBusy(question._id);
    try {
      const res = await fetch(
        `/api/admin/tools/${toolId}/sections/${sectionId}/questions/${question._id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestionsBySection((prev) => ({
          ...prev,
          [sectionId]: prev[sectionId].filter((q) => q._id !== question._id),
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
        Loading sections…
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
          const questions = [...(questionsBySection[section._id] || [])].sort(
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
                    ({questions.length || (questionsBySection[section._id] ? 0 : '…')} questions)
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
                  {questionsLoading[section._id] ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      Loading questions…
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {questions.map((question, questionIndex) => (
                        <li key={question._id} className="rounded-lg border border-line bg-white p-3">
                          <div className="flex items-center gap-2">
                            <span className="flex-1 truncate text-sm font-semibold text-ink">
                              {question.questionText}
                            </span>
                            <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-dark">
                              {questionTypeLabel(question.questionType)}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveQuestion(section._id, question, -1)}
                              disabled={busy === question._id || questionIndex === 0}
                              className="rounded p-1 text-muted hover:bg-sage disabled:opacity-30"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestion(section._id, question, 1)}
                              disabled={busy === question._id || questionIndex === questions.length - 1}
                              className="rounded p-1 text-muted hover:bg-sage disabled:opacity-30"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingQuestion(
                                  editingQuestion?.question._id === question._id
                                    ? null
                                    : { sectionId: section._id, question }
                                )
                              }
                              className="rounded p-1 text-primary-dark hover:bg-sage"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteQuestion(section._id, question)}
                              disabled={busy === question._id}
                              className="rounded p-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {editingQuestion?.question._id === question._id && (
                            <QuestionEditorPanel
                              toolId={toolId}
                              sectionId={section._id}
                              question={editingQuestion.question}
                              onSaved={(updated) => {
                                setQuestionsBySection((prev) => ({
                                  ...prev,
                                  [section._id]: prev[section._id].map((q) =>
                                    q._id === updated._id ? updated : q
                                  ),
                                }));
                                setEditingQuestion(null);
                              }}
                              onClose={() => setEditingQuestion(null)}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    onClick={() => addQuestion(section._id)}
                    disabled={busy === section._id}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary disabled:opacity-60"
                  >
                    <Plus size={13} />
                    Add question
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
          placeholder="New section title (e.g. Balance & Gait)"
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
