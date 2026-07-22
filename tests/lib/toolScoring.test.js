import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreAnswer, computeToolScore } from '@/lib/toolScoring.js';

const RADIO_QUESTION = {
  _id: 'q1',
  questionType: 'radio',
  options: [
    { label: 'Yes', value: 'yes', score: 2 },
    { label: 'No', value: 'no', score: 0 },
  ],
};

const CHECKBOX_QUESTION = {
  _id: 'q2',
  questionType: 'checkbox',
  options: [
    { label: 'Poor lighting', value: 'lighting', score: 1 },
    { label: 'Loose rugs', value: 'rugs', score: 2 },
    { label: 'No grab bars', value: 'grabbars', score: 2 },
  ],
};

const NUMERIC_QUESTION = {
  _id: 'q3',
  questionType: 'numeric',
  numericConfig: {
    scoreBands: [
      { min: 0, max: 3, score: 0 },
      { min: 4, max: 10, score: 3 },
    ],
  },
};

describe('scoreAnswer', () => {
  it('scores a radio answer by matching option value', () => {
    assert.equal(scoreAnswer(RADIO_QUESTION, 'yes'), 2);
    assert.equal(scoreAnswer(RADIO_QUESTION, 'no'), 0);
  });

  it('returns 0 for a radio answer with no matching option', () => {
    assert.equal(scoreAnswer(RADIO_QUESTION, 'maybe'), 0);
  });

  it('sums scores for every selected checkbox option', () => {
    assert.equal(scoreAnswer(CHECKBOX_QUESTION, ['lighting', 'rugs']), 3);
    assert.equal(scoreAnswer(CHECKBOX_QUESTION, ['lighting', 'rugs', 'grabbars']), 5);
    assert.equal(scoreAnswer(CHECKBOX_QUESTION, []), 0);
  });

  it('matches a numeric answer against its scoreBands', () => {
    assert.equal(scoreAnswer(NUMERIC_QUESTION, 2), 0);
    assert.equal(scoreAnswer(NUMERIC_QUESTION, 7), 3);
  });

  it('returns 0 for a non-finite numeric answer', () => {
    assert.equal(scoreAnswer(NUMERIC_QUESTION, 'not-a-number'), 0);
  });

  it('returns 0 for a missing question', () => {
    assert.equal(scoreAnswer(null, 'yes'), 0);
  });
});

describe('computeToolScore', () => {
  const questions = [RADIO_QUESTION, CHECKBOX_QUESTION, NUMERIC_QUESTION];
  const resultBands = [
    { minScore: 0, maxScore: 3, label: 'Low risk' },
    { minScore: 4, maxScore: 7, label: 'Moderate risk' },
    { minScore: 8, maxScore: 20, label: 'High risk' },
  ];

  it('sums scores across all answered questions and matches the right band', () => {
    const { totalScore, band } = computeToolScore({
      questions,
      answers: [
        { questionId: 'q1', value: 'yes' }, // 2
        { questionId: 'q2', value: ['rugs', 'grabbars'] }, // 4
        { questionId: 'q3', value: 7 }, // 3
      ],
      resultBands,
    });
    assert.equal(totalScore, 9);
    assert.equal(band.label, 'High risk');
  });

  it('returns a null band when no configured band covers the score', () => {
    const { totalScore, band } = computeToolScore({
      questions,
      answers: [{ questionId: 'q1', value: 'yes' }],
      resultBands: [{ minScore: 10, maxScore: 20, label: 'High risk' }],
    });
    assert.equal(totalScore, 2);
    assert.equal(band, null);
  });

  it('handles no answers at all (score 0)', () => {
    const { totalScore, band } = computeToolScore({ questions, answers: [], resultBands });
    assert.equal(totalScore, 0);
    assert.equal(band.label, 'Low risk');
  });
});
