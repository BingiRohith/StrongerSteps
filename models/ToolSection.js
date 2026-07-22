import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Tool Sections collection (Sprint 19.4) — the middle tier of the Tool →
 * ToolSection → ToolQuestion hierarchy. A separate top-level collection
 * rather than an embedded array on Tool, following this project's
 * established "hierarchy = separate collection + FK ref" convention
 * (models/Section.js/models/ResourceFile.js) — mirrors models/Section.js
 * exactly (a Section's visibility follows its parent's status; no
 * accessLevel of its own).
 */
const ToolSectionSchema = new Schema(
  {
    tool: {
      type: Schema.Types.ObjectId,
      ref: 'Tool',
      required: [true, 'Tool is required'],
    },
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    // Scoped to siblings within the same tool.
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ToolSectionSchema.index({ tool: 1, displayOrder: 1 });

ToolSectionSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    tool: this.tool,
    title: this.title,
    description: this.description,
    displayOrder: this.displayOrder,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.ToolSection || model('ToolSection', ToolSectionSchema);
