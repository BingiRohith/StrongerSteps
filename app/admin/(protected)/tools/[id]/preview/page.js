import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft, Eye } from 'lucide-react';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolCategory from '@/models/ToolCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import ToolSection from '@/models/ToolSection';
import ToolQuestion from '@/models/ToolQuestion';
import ToolResultBand from '@/models/ToolResultBand';
import { questionTypeLabel } from '@/lib/toolOptions';

export const dynamic = 'force-dynamic';

/**
 * Admin-only draft preview — no existing "preview draft content" precedent
 * in this codebase to reuse (checked: Resources/Courses have no equivalent
 * route), so this is a new, narrowly-scoped pattern: protected entirely by
 * the existing `(protected)` admin route group's auth (same as every other
 * admin page), fetching the Tool/sections/questions/result bands
 * regardless of `status` via the already-auth-gated model layer directly —
 * no public route or query-param bypass that could ever leak unpublished
 * content. Renders a structural read-only preview (not the interactive
 * scoring form public visitors get on `/tools/[slug]`), which is enough to
 * review content/scoring before publishing.
 */
export default async function ToolPreviewPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const tool = await Tool.findById(params.id).populate('category', 'name slug').lean();
  if (!tool) notFound();

  const [sections, questions, resultBands] = await Promise.all([
    ToolSection.find({ tool: params.id }).sort({ displayOrder: 1 }).lean(),
    ToolQuestion.find({ tool: params.id }).sort({ displayOrder: 1 }).lean(),
    ToolResultBand.find({ tool: params.id }).sort({ minScore: 1 }).lean(),
  ]);

  const questionsBySection = new Map();
  for (const question of questions) {
    const key = String(question.section);
    if (!questionsBySection.has(key)) questionsBySection.set(key, []);
    questionsBySection.get(key).push(question);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/tools"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft size={16} />
          Back to tools
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-dark">
          <Eye size={13} />
          Draft preview — {tool.status}
        </span>
      </div>

      <div className="rounded-xl2 border border-line bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
          {tool.category?.name || 'Uncategorized'}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-primary-dark">{tool.title}</h1>
        {tool.description && <p className="mt-2 text-sm text-muted">{tool.description}</p>}
        {tool.disclaimer && (
          <p className="mt-3 rounded-lg bg-sage px-3.5 py-2.5 text-xs text-primary-dark">{tool.disclaimer}</p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {sections.map((section) => (
          <div key={section._id} className="rounded-xl2 border border-line bg-surface p-5">
            <h2 className="font-display text-sm font-bold text-primary-dark">{section.title}</h2>
            {section.description && <p className="mt-1 text-xs text-muted">{section.description}</p>}

            <ul className="mt-3 space-y-3">
              {(questionsBySection.get(String(section._id)) || []).map((question) => (
                <li key={question._id} className="rounded-lg border border-line bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{question.questionText}</span>
                    <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-dark">
                      {questionTypeLabel(question.questionType)}
                    </span>
                    {question.required && (
                      <span className="text-[10px] font-semibold uppercase text-accent-dark">Required</span>
                    )}
                  </div>
                  {question.helpText && <p className="mt-1 text-xs text-muted">{question.helpText}</p>}

                  {['radio', 'checkbox', 'yesno'].includes(question.questionType) && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {(question.options || []).map((option, i) => (
                        // eslint-disable-next-line react/no-array-index-key -- options have no stable id
                        <li key={i} className="rounded-full bg-bg px-2.5 py-1 text-[11px] text-ink">
                          {option.label || option.value} <span className="text-muted">(score {option.score})</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {question.questionType === 'numeric' && (
                    <p className="mt-2 text-[11px] text-muted">
                      Range {question.numericConfig?.min}–{question.numericConfig?.max} {question.numericConfig?.unit},{' '}
                      {question.numericConfig?.scoreBands?.length || 0} score band
                      {question.numericConfig?.scoreBands?.length === 1 ? '' : 's'}
                    </p>
                  )}
                </li>
              ))}
              {(questionsBySection.get(String(section._id)) || []).length === 0 && (
                <li className="text-xs text-muted">No questions in this section yet.</li>
              )}
            </ul>
          </div>
        ))}
        {sections.length === 0 && (
          <p className="text-sm text-muted">No sections yet — add them from the builder.</p>
        )}
      </div>

      <div className="mt-6 rounded-xl2 border border-line bg-surface p-5">
        <h2 className="font-display text-sm font-bold text-primary-dark">Scoring & recommendations</h2>
        <ul className="mt-3 space-y-2">
          {resultBands.map((band) => (
            <li key={band._id} className="rounded-lg border border-line bg-white p-3 text-sm">
              <span className="font-semibold text-ink">{band.label}</span>{' '}
              <span className="text-muted">
                ({band.minScore}–{band.maxScore})
              </span>
              {band.recommendations?.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-muted">
                  {band.recommendations.map((rec, i) => (
                    // eslint-disable-next-line react/no-array-index-key -- recommendations have no stable id
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {resultBands.length === 0 && (
            <li className="text-xs text-muted">No scoring rules yet — add them from the scoring manager.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
