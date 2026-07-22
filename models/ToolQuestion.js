import mongoose from 'mongoose';
import { QUESTION_TYPE_VALUES } from '@/lib/toolOptions';

const { Schema, models, model } = mongoose;

/**
 * Tool Questions collection (Sprint 19.4) — the leaf tier of Tool →
 * ToolSection → ToolQuestion. A separate top-level collection, same
 * reasoning as models/Lesson.js. Carries both `section` (its direct
 * parent) and a denormalized `tool` ref — same deliberate denormalization
 * Lesson.course uses, since scoring (lib/toolScoring.js) and the
 * assessment-submit route need every question for a tool in one query
 * without populating through section.
 *
 * `options[]` is used for `questionType` radio/checkbox/yesno — every
 * option (including yesno's two) is admin-authored with its own
 * label/value/score, not a hardcoded Yes/No pair, so scoring stays fully
 * CMS-driven (no hardcoded values anywhere in the assessment engine).
 * `numericConfig` is used only for `questionType: 'numeric'`: `min`/`max`/
 * `step`/`unit` drive the public input control, and `scoreBands[]` are the
 * admin-authored ranges lib/toolScoring.js matches a submitted number
 * against — this is the "dynamic thresholds" requirement.
 */
const ToolQuestionSchema = new Schema(
  {
    section: {
      type: Schema.Types.ObjectId,
      ref: 'ToolSection',
      required: [true, 'Section is required'],
    },
    tool: {
      type: Schema.Types.ObjectId,
      ref: 'Tool',
      required: [true, 'Tool is required'],
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: 300,
    },
    helpText: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    questionType: {
      type: String,
      enum: QUESTION_TYPE_VALUES,
      required: [true, 'Question type is required'],
      default: 'radio',
    },
    // Scoped to siblings within the same section.
    displayOrder: {
      type: Number,
      default: 0,
    },
    required: {
      type: Boolean,
      default: true,
    },
    options: {
      type: [
        {
          label: { type: String, trim: true, maxlength: 150, default: '' },
          value: { type: String, trim: true, maxlength: 100, default: '' },
          score: { type: Number, default: 0 },
          _id: false,
        },
      ],
      default: [],
    },
    numericConfig: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
      step: { type: Number, default: 1 },
      unit: { type: String, trim: true, maxlength: 30, default: '' },
      scoreBands: {
        type: [
          {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 },
            score: { type: Number, default: 0 },
            _id: false,
          },
        ],
        default: [],
      },
    },
  },
  { timestamps: true }
);

ToolQuestionSchema.index({ section: 1, displayOrder: 1 });
ToolQuestionSchema.index({ tool: 1 });

ToolQuestionSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    section: this.section,
    tool: this.tool,
    questionText: this.questionText,
    helpText: this.helpText,
    questionType: this.questionType,
    displayOrder: this.displayOrder,
    required: this.required,
    options: this.options,
    numericConfig: this.numericConfig,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.ToolQuestion || model('ToolQuestion', ToolQuestionSchema);
