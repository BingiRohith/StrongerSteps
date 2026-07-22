/**
 * Sprint 19.4 — the Fall Risk Assessment (and any future assessment/
 * calculator Tool) scoring engine. Pure and testable: takes plain data in,
 * returns plain data out, no DB/request access — same "pure decision
 * function" shape as lib/access/canAccess.js. Every number it works with
 * comes from admin-authored models/ToolQuestion.js `options[]`/
 * `numericConfig.scoreBands[]` and models/ToolResultBand.js rows — nothing
 * here is hardcoded per-tool, so a brand new assessment just needs new rows,
 * not new code.
 */

/**
 * @param {object} question - a ToolQuestion (or its toSafeObject()/lean() shape)
 * @param {*} value - the submitted answer for this question: a string
 *   (radio/yesno option value), an array of strings (checkbox selected
 *   option values), or a number (numeric)
 * @returns {number} the score contributed by this single answer
 */
export function scoreAnswer(question, value) {
  if (!question) return 0;

  if (question.questionType === 'radio' || question.questionType === 'yesno') {
    const option = (question.options || []).find((o) => String(o.value) === String(value));
    return option ? Number(option.score) || 0 : 0;
  }

  if (question.questionType === 'checkbox') {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (question.options || [])
      .filter((o) => selected.includes(String(o.value)))
      .reduce((sum, o) => sum + (Number(o.score) || 0), 0);
  }

  if (question.questionType === 'numeric') {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    const band = (question.numericConfig?.scoreBands || []).find(
      (b) => num >= Number(b.min) && num <= Number(b.max)
    );
    return band ? Number(band.score) || 0 : 0;
  }

  return 0;
}

/**
 * @param {object[]} questions - all ToolQuestion rows for the tool
 * @param {{questionId: string, value: *}[]} answers - the submitted answers
 * @param {object[]} resultBands - all ToolResultBand rows for the tool
 * @returns {{totalScore: number, band: object|null}}
 */
export function computeToolScore({ questions = [], answers = [], resultBands = [] }) {
  const questionsById = new Map(questions.map((q) => [String(q._id || q.id), q]));

  const totalScore = answers.reduce((sum, answer) => {
    const question = questionsById.get(String(answer.questionId));
    return sum + scoreAnswer(question, answer.value);
  }, 0);

  const band =
    resultBands.find((b) => totalScore >= Number(b.minScore) && totalScore <= Number(b.maxScore)) || null;

  return { totalScore, band };
}
