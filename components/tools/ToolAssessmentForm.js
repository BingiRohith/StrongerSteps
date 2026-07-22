'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Lock, CreditCard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import VerificationModal from '@/components/verification/VerificationModal';

/**
 * Sprint 19.4 — the Fall Risk Assessment (and any future assessment/
 * calculator Tool) form. Fully CMS-driven: renders whatever
 * sections/questions the admin authored (see lib/publicTools.js's
 * getToolBySlug), computes nothing itself — scoring happens server-side
 * (lib/toolScoring.js) via POST /api/tools/[slug]/attempt.
 *
 * Sections/questions are always visible to everyone (see that model's
 * header comment) — the access gate only applies to *submitting* for a
 * scored result:
 * - `OTP`: a 401 response opens VerificationModal inline (skipRedirect,
 *   since a Tool's OTP gate protects a computed result, not a file — see
 *   lib/verification/resourceRegistry.js's `tool` entry); the freshly
 *   issued token is used to auto-resubmit once verified.
 * - `MEMBER`/`PURCHASED`/`ADMIN`: a 403 response shows a locked panel
 *   (same copy/pattern as app/courses/[slug]/lessons/[lessonId]/page.js's
 *   LockedLessonPanel, since course purchases and this tool's own
 *   membership/purchase flows aren't built yet either).
 * - `PUBLIC`: the attempt route never rejects, so this path is unreachable.
 */
export default function ToolAssessmentForm({ tool }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [result, setResult] = useState(null);
  const [locked, setLocked] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const allQuestions = (tool.sections || []).flatMap((s) => s.questions || []);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleCheckboxValue(questionId, value) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [questionId]: next };
    });
  }

  function findMissingRequired() {
    return allQuestions.filter((q) => {
      if (!q.required) return false;
      const value = answers[q._id];
      if (q.questionType === 'checkbox') return !Array.isArray(value) || value.length === 0;
      return value === undefined || value === null || value === '';
    });
  }

  async function submitAttempt(downloadToken) {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        answers: allQuestions
          .filter((q) => answers[q._id] !== undefined && answers[q._id] !== '')
          .map((q) => ({ questionId: q._id, value: answers[q._id] })),
        ...(downloadToken ? { downloadToken } : {}),
      };

      const res = await fetch(`/api/tools/${tool.slug}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 401) {
        setVerifyOpen(true);
        return;
      }
      if (res.status === 403) {
        setLocked(true);
        return;
      }
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not compute your result. Please try again.');
        return;
      }

      setResult(data);
      setVerifyOpen(false);
    } catch (err) {
      setError('Could not compute your result. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const missing = findMissingRequired();
    if (missing.length > 0) {
      setValidationError('Please answer every required question before seeing your result.');
      return;
    }
    setValidationError('');
    submitAttempt();
  }

  function handleVerified(token) {
    submitAttempt(token);
  }

  function retake() {
    setAnswers({});
    setResult(null);
    setLocked(false);
    setError('');
    setValidationError('');
  }

  if (locked) {
    return <LockedToolPanel accessLevel={tool.accessLevel} onBack={() => setLocked(false)} />;
  }

  if (result) {
    return <ToolResultPanel result={result} onRetake={retake} />;
  }

  return (
    <div>
      {tool.disclaimer && (
        <div className="mb-8 flex items-start gap-2 rounded-xl2 border border-line bg-sage/60 px-4 py-3.5 text-sm text-ink">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden="true" />
          <span>{tool.disclaimer}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {(tool.sections || []).map((section) => (
          <div key={section._id}>
            <h2 className="font-display text-xl font-bold text-primary-dark">{section.title}</h2>
            {section.description && <p className="mt-1.5 text-sm text-muted">{section.description}</p>}

            <div className="mt-5 space-y-6">
              {(section.questions || []).map((question) => (
                <QuestionField
                  key={question._id}
                  question={question}
                  value={answers[question._id]}
                  onChange={(value) => setAnswer(question._id, value)}
                  onToggleCheckbox={(value) => toggleCheckboxValue(question._id, value)}
                />
              ))}
            </div>
          </div>
        ))}

        {validationError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          See my result
        </button>
      </form>

      {verifyOpen && (
        <VerificationModal
          resourceType="tool"
          resourceId={tool._id}
          fileKind="result"
          skipRedirect
          onVerified={handleVerified}
          onClose={() => setVerifyOpen(false)}
        />
      )}
    </div>
  );
}

function QuestionField({ question, value, onChange, onToggleCheckbox }) {
  return (
    <fieldset className="rounded-xl2 border border-line bg-white p-5">
      <legend className="px-1 font-display text-sm font-semibold text-ink">
        {question.questionText}
        {question.required && <span className="ml-1 text-accent-dark">*</span>}
      </legend>
      {question.helpText && <p className="mt-1 text-xs text-muted">{question.helpText}</p>}

      <div className="mt-3">
        {(question.questionType === 'radio' || question.questionType === 'yesno') && (
          <div className="flex flex-wrap gap-2">
            {(question.options || []).map((opt) => (
              <label
                key={opt.value}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  value === opt.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-line text-ink hover:border-primary'
                }`}
              >
                <input
                  type="radio"
                  name={question._id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}

        {question.questionType === 'checkbox' && (
          <div className="flex flex-wrap gap-2">
            {(question.options || []).map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    checked ? 'border-primary bg-primary text-white' : 'border-line text-ink hover:border-primary'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={checked}
                    onChange={() => onToggleCheckbox(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        )}

        {question.questionType === 'numeric' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={question.numericConfig?.min}
              max={question.numericConfig?.max}
              step={question.numericConfig?.step || 1}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-32 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {question.numericConfig?.unit && <span className="text-sm text-muted">{question.numericConfig.unit}</span>}
          </div>
        )}
      </div>
    </fieldset>
  );
}

function ToolResultPanel({ result, onRetake }) {
  const { totalScore, band } = result;

  return (
    <div className="rounded-xl2 border border-line bg-white p-6 sm:p-8">
      <div className="flex items-center gap-2 text-primary">
        <CheckCircle2 size={22} aria-hidden="true" />
        <span className="font-display text-sm font-semibold uppercase tracking-wide">Your result</span>
      </div>

      <p className="mt-4 font-display text-4xl font-bold text-primary-dark">{totalScore}</p>
      <p className="text-sm text-muted">Total score</p>

      {band ? (
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="font-display text-xl font-bold text-primary-dark">{band.label}</h3>
          {band.description && <p className="mt-2 text-base leading-relaxed text-ink">{band.description}</p>}

          {band.recommendations?.length > 0 && (
            <div className="mt-5">
              <h4 className="font-display text-sm font-bold uppercase tracking-wide text-primary-dark">
                Recommendations
              </h4>
              <ul className="mt-3 space-y-2">
                {band.recommendations.map((rec, i) => (
                  // eslint-disable-next-line react/no-array-index-key -- recommendations have no stable id
                  <li key={i} className="flex items-start gap-2 rounded-xl2 bg-sage p-3.5 text-sm text-ink">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 border-t border-line pt-6 text-sm text-muted">
          No specific recommendations are available for this score yet.
        </p>
      )}

      <button
        type="button"
        onClick={onRetake}
        className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 font-display text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
      >
        <RotateCcw size={15} aria-hidden="true" />
        Retake assessment
      </button>
    </div>
  );
}

function LockedToolPanel({ accessLevel, onBack }) {
  const isMember = accessLevel === 'MEMBER';

  return (
    <div className="flex flex-col items-center rounded-xl2 border border-line bg-white px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
        <Lock size={20} aria-hidden="true" />
      </span>
      <p className="font-display text-base font-semibold text-ink">
        {isMember ? 'This tool requires membership' : 'This tool requires purchase'}
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {isMember
          ? 'Join Stronger Steps membership to see your result and recommendations.'
          : 'Purchases aren’t available yet — check back soon.'}
      </p>
      {isMember && (
        <div className="mt-5">
          <Button href="/join" variant="outline" size="sm">
            <CreditCard size={15} aria-hidden="true" />
            View membership plans
          </Button>
        </div>
      )}
      <button
        type="button"
        onClick={onBack}
        className="mt-5 text-sm font-semibold text-primary hover:text-primary-dark"
      >
        Back to the assessment
      </button>
    </div>
  );
}
