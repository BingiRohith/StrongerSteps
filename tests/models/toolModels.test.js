import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Tool from '@/models/Tool.js';
import ToolCategory from '@/models/ToolCategory.js';
import ToolSection from '@/models/ToolSection.js';
import ToolQuestion from '@/models/ToolQuestion.js';
import ToolResultBand from '@/models/ToolResultBand.js';

// Mirrors tests/models/resourceModels.test.js's approach — validateSync()
// covers schema-level rules without a DB connection or the async
// pre('validate') hooks (slug generation, publishedAt stamping).

const VALID_CATEGORY_ID = '507f1f77bcf86cd799439011';
const VALID_TOOL_ID = '507f1f77bcf86cd799439012';
const VALID_SECTION_ID = '507f1f77bcf86cd799439013';

describe('Tool validation', () => {
  it('rejects a tool with no title or category', () => {
    const tool = new Tool({});
    const error = tool.validateSync();
    assert.ok(error);
    assert.ok(error.errors.title);
    assert.ok(error.errors.category);
  });

  it('accepts a tool with just title and category (everything else defaults)', () => {
    const tool = new Tool({ title: 'Fall Risk Assessment', category: VALID_CATEGORY_ID });
    const error = tool.validateSync();
    assert.equal(error, undefined);
    assert.equal(tool.status, 'draft');
    assert.equal(tool.accessLevel, 'PUBLIC');
    assert.equal(tool.toolType, 'assessment');
    assert.equal(tool.estimatedMinutes, 0);
  });

  it('rejects an invalid toolType', () => {
    const tool = new Tool({
      title: 'Test Tool',
      category: VALID_CATEGORY_ID,
      toolType: 'quiz', // not in TOOL_TYPE_VALUES
    });
    const error = tool.validateSync();
    assert.ok(error?.errors.toolType);
  });

  it('rejects an invalid accessLevel value', () => {
    const tool = new Tool({
      title: 'Test Tool',
      category: VALID_CATEGORY_ID,
      accessLevel: 'FREE_TIER',
    });
    const error = tool.validateSync();
    assert.ok(error?.errors.accessLevel);
  });

  it('rejects a negative estimatedMinutes', () => {
    const tool = new Tool({
      title: 'Test Tool',
      category: VALID_CATEGORY_ID,
      estimatedMinutes: -5,
    });
    const error = tool.validateSync();
    assert.ok(error?.errors.estimatedMinutes);
  });
});

describe('ToolCategory validation', () => {
  it('rejects a category with no name', () => {
    const category = new ToolCategory({});
    const error = category.validateSync();
    assert.ok(error?.errors.name);
  });

  it('accepts a category with just a name', () => {
    const category = new ToolCategory({ name: 'Assessments' });
    const error = category.validateSync();
    assert.equal(error, undefined);
    assert.equal(category.isActive, true);
  });
});

describe('ToolSection validation', () => {
  it('rejects a section with no tool or title', () => {
    const section = new ToolSection({});
    const error = section.validateSync();
    assert.ok(error?.errors.tool);
    assert.ok(error?.errors.title);
  });

  it('accepts a section with tool and title', () => {
    const section = new ToolSection({ tool: VALID_TOOL_ID, title: 'Balance & Gait' });
    const error = section.validateSync();
    assert.equal(error, undefined);
    assert.equal(section.displayOrder, 0);
  });
});

describe('ToolQuestion validation', () => {
  it('rejects a question with no section, tool, or questionText', () => {
    const question = new ToolQuestion({});
    const error = question.validateSync();
    assert.ok(error?.errors.section);
    assert.ok(error?.errors.tool);
    assert.ok(error?.errors.questionText);
  });

  it('accepts a minimal radio question and defaults questionType/required', () => {
    const question = new ToolQuestion({
      section: VALID_SECTION_ID,
      tool: VALID_TOOL_ID,
      questionText: 'Have you fallen in the past year?',
    });
    const error = question.validateSync();
    assert.equal(error, undefined);
    assert.equal(question.questionType, 'radio');
    assert.equal(question.required, true);
    assert.deepEqual(question.options, []);
  });

  it('rejects an invalid questionType', () => {
    const question = new ToolQuestion({
      section: VALID_SECTION_ID,
      tool: VALID_TOOL_ID,
      questionText: 'Test?',
      questionType: 'slider', // not in QUESTION_TYPE_VALUES
    });
    const error = question.validateSync();
    assert.ok(error?.errors.questionType);
  });

  it('accepts options with label/value/score for a radio question', () => {
    const question = new ToolQuestion({
      section: VALID_SECTION_ID,
      tool: VALID_TOOL_ID,
      questionText: 'Do you use a walking aid?',
      questionType: 'radio',
      options: [
        { label: 'Yes', value: 'yes', score: 2 },
        { label: 'No', value: 'no', score: 0 },
      ],
    });
    const error = question.validateSync();
    assert.equal(error, undefined);
    assert.equal(question.options.length, 2);
    assert.equal(question.options[0].score, 2);
  });

  it('accepts numericConfig with scoreBands for a numeric question', () => {
    const question = new ToolQuestion({
      section: VALID_SECTION_ID,
      tool: VALID_TOOL_ID,
      questionText: 'How many medications do you take daily?',
      questionType: 'numeric',
      numericConfig: {
        min: 0,
        max: 20,
        step: 1,
        unit: 'medications',
        scoreBands: [
          { min: 0, max: 3, score: 0 },
          { min: 4, max: 20, score: 3 },
        ],
      },
    });
    const error = question.validateSync();
    assert.equal(error, undefined);
    assert.equal(question.numericConfig.scoreBands.length, 2);
  });
});

describe('ToolResultBand validation', () => {
  it('rejects a band with no tool, minScore, maxScore, or label', () => {
    const band = new ToolResultBand({});
    const error = band.validateSync();
    assert.ok(error?.errors.tool);
    assert.ok(error?.errors.minScore);
    assert.ok(error?.errors.maxScore);
    assert.ok(error?.errors.label);
  });

  it('accepts a minimal band and trims/dedupes-empty recommendations', () => {
    const band = new ToolResultBand({
      tool: VALID_TOOL_ID,
      minScore: 0,
      maxScore: 3,
      label: 'Low risk',
      recommendations: [' Stay active ', '', 'Review medications annually'],
    });
    const error = band.validateSync();
    assert.equal(error, undefined);
    assert.deepEqual(band.recommendations, ['Stay active', 'Review medications annually']);
  });
});
