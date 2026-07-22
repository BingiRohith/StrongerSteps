import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Tool Result Bands collection (Sprint 19.4) — one model covers both
 * "Scoring Rules" and "Recommendation Builder" from the Sprint 19.4 brief,
 * deliberately not two separate CRUD systems: a score range, a risk label,
 * and its recommendations are one concept (a band), and splitting them into
 * separate models/routes/admin screens would be pure duplication for no
 * added flexibility.
 *
 * `label`/`description`/`recommendations` are free text authored per tool
 * by the admin — not a hardcoded Low/Moderate/High enum — so a future tool
 * with a different number of risk tiers or different wording needs zero
 * code changes, only new rows. See lib/toolScoring.js for how a computed
 * `totalScore` is matched to a band via `[minScore, maxScore]`.
 */
const ToolResultBandSchema = new Schema(
  {
    tool: {
      type: Schema.Types.ObjectId,
      ref: 'Tool',
      required: [true, 'Tool is required'],
    },
    minScore: {
      type: Number,
      required: [true, 'Minimum score is required'],
    },
    maxScore: {
      type: Number,
      required: [true, 'Maximum score is required'],
    },
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    recommendations: {
      type: [String],
      default: [],
      set: (arr) => (Array.isArray(arr) ? arr.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean) : []),
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ToolResultBandSchema.index({ tool: 1, minScore: 1 });

ToolResultBandSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    tool: this.tool,
    minScore: this.minScore,
    maxScore: this.maxScore,
    label: this.label,
    description: this.description,
    recommendations: this.recommendations,
    displayOrder: this.displayOrder,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.ToolResultBand || model('ToolResultBand', ToolResultBandSchema);
