'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Lock, Eye, PlayCircle, FileText, Image as ImageIcon, Link2, Type } from 'lucide-react';

const LESSON_ICONS = {
  video: PlayCircle,
  pdf: FileText,
  image: ImageIcon,
  external_link: Link2,
  text: Type,
};

/**
 * Public curriculum outline for a course detail page. Every lesson's
 * metadata (title, type, duration) is always visible — only the `locked`
 * flag (set server-side by lib/courseAccess.js's annotateLessonAccess())
 * decides whether the row links to the lesson viewer or shows a lock icon.
 */
export default function CourseCurriculumAccordion({ courseSlug, sections }) {
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    (sections || []).forEach((s) => {
      initial[s._id] = !s.collapsedByDefault;
    });
    return initial;
  });

  if (!sections?.length) {
    return <p className="text-sm text-muted">Curriculum coming soon.</p>;
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const isOpen = openSections[section._id];
        return (
          <div key={section._id} className="overflow-hidden rounded-xl2 border border-line bg-white">
            <button
              type="button"
              onClick={() => setOpenSections((prev) => ({ ...prev, [section._id]: !prev[section._id] }))}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span>
                <span className="font-display text-sm font-semibold text-primary-dark">{section.title}</span>
                <span className="ml-2 text-xs text-muted">
                  {section.lessons?.length || 0} lesson{section.lessons?.length === 1 ? '' : 's'}
                </span>
              </span>
              {isOpen ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
            </button>

            {isOpen && (
              <ul className="divide-y divide-line border-t border-line">
                {(section.lessons || []).map((lesson) => {
                  const Icon = LESSON_ICONS[lesson.lessonType] || Type;
                  const isLocked = lesson.locked;
                  const content = (
                    <>
                      <Icon size={16} className="shrink-0 text-primary" aria-hidden="true" />
                      <span className="flex-1 text-sm text-ink">{lesson.title}</span>
                      {lesson.estimatedDuration > 0 && (
                        <span className="text-xs text-muted">{lesson.estimatedDuration} min</span>
                      )}
                      {lesson.previewAvailable && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <Eye size={12} /> Preview
                        </span>
                      )}
                      {isLocked ? (
                        <Lock size={14} className="shrink-0 text-muted" aria-hidden="true" />
                      ) : null}
                    </>
                  );

                  return (
                    <li key={lesson._id}>
                      {isLocked ? (
                        <div className="flex items-center gap-3 px-5 py-3 opacity-60">{content}</div>
                      ) : (
                        <Link
                          href={`/courses/${courseSlug}/lessons/${lesson._id}`}
                          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-sage/40"
                        >
                          {content}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
