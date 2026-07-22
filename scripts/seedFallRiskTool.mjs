/**
 * One-time bootstrap script for Sprint 19.4's Tools CMS: seeds the first
 * real tool, the Fall Risk Assessment Calculator, so the new /tools listing
 * and assessment engine have real content to render immediately after this
 * sprint ships (same "seed the placeholder that used to be hardcoded"
 * reasoning as scripts/seedProducts.mjs/scripts/seedTeam.mjs).
 *
 * Creates one ToolCategory ("Health Assessments"), one Tool, 4 ToolSections,
 * 9 ToolQuestions (covering every questionType — radio/checkbox/yesno/
 * numeric — and numeric scoreBands), and 3 ToolResultBands (Low/Moderate/
 * High risk with recommendations). Every score/threshold/recommendation
 * lives in this seed data, not in any scoring code (lib/toolScoring.js
 * reads all of it dynamically) — this is data, not a special case.
 *
 * Usage:
 *   node scripts/seedFallRiskTool.mjs
 *
 * Safe to re-run: skips entirely if a Tool with this slug already exists
 * (does not overwrite an admin's own edits to it).
 *
 * Schema shape duplicated here rather than imported from models/Tool.js and
 * friends — this script runs under plain Node ESM outside Next's bundler,
 * same reason documented in scripts/seedProducts.mjs.
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in your environment (.env.local).');
  process.exit(1);
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const ToolCategorySchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    icon: { url: { type: String, default: '' }, alt: { type: String, default: '' } },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const ToolCategory = mongoose.models.ToolCategory || mongoose.model('ToolCategory', ToolCategorySchema);

const ToolSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    thumbnail: { url: { type: String, default: '' }, alt: { type: String, default: '' } },
    banner: { url: { type: String, default: '' }, alt: { type: String, default: '' } },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ToolCategory' },
    tags: { type: [String], default: [] },
    toolType: { type: String, default: 'assessment' },
    disclaimer: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 0 },
    displayOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    accessLevel: { type: String, default: 'PUBLIC' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date, default: null },
    seo: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);
const Tool = mongoose.models.Tool || mongoose.model('Tool', ToolSchema);

const ToolSectionSchema = new mongoose.Schema(
  {
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    title: String,
    description: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const ToolSection = mongoose.models.ToolSection || mongoose.model('ToolSection', ToolSectionSchema);

const ToolQuestionSchema = new mongoose.Schema(
  {
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'ToolSection' },
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    questionText: String,
    helpText: { type: String, default: '' },
    questionType: { type: String, default: 'radio' },
    displayOrder: { type: Number, default: 0 },
    required: { type: Boolean, default: true },
    options: {
      type: [{ label: String, value: String, score: Number, _id: false }],
      default: [],
    },
    numericConfig: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
      step: { type: Number, default: 1 },
      unit: { type: String, default: '' },
      scoreBands: {
        type: [{ min: Number, max: Number, score: Number, _id: false }],
        default: [],
      },
    },
  },
  { timestamps: true }
);
const ToolQuestion = mongoose.models.ToolQuestion || mongoose.model('ToolQuestion', ToolQuestionSchema);

const ToolResultBandSchema = new mongoose.Schema(
  {
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    minScore: Number,
    maxScore: Number,
    label: String,
    description: { type: String, default: '' },
    recommendations: { type: [String], default: [] },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const ToolResultBand = mongoose.models.ToolResultBand || mongoose.model('ToolResultBand', ToolResultBandSchema);

const TOOL_SLUG = 'fall-risk-assessment';

const SECTIONS = [
  {
    title: 'Fall History',
    description: 'Falls in the past year are the single strongest predictor of a future fall.',
    displayOrder: 0,
    questions: [
      {
        questionText: 'Have you fallen in the past 12 months?',
        questionType: 'yesno',
        displayOrder: 0,
        options: [
          { label: 'Yes', value: 'yes', score: 2 },
          { label: 'No', value: 'no', score: 0 },
        ],
      },
      {
        questionText: 'How many times have you fallen in the past 12 months?',
        helpText: 'Enter 0 if you have not fallen.',
        questionType: 'numeric',
        displayOrder: 1,
        numericConfig: {
          min: 0,
          max: 20,
          step: 1,
          unit: 'falls',
          scoreBands: [
            { min: 0, max: 0, score: 0 },
            { min: 1, max: 1, score: 1 },
            { min: 2, max: 20, score: 3 },
          ],
        },
      },
    ],
  },
  {
    title: 'Balance & Mobility',
    description: 'Balance, gait, and the need for mobility aids are core clinical fall-risk factors.',
    displayOrder: 1,
    questions: [
      {
        questionText: 'How would you describe your balance?',
        questionType: 'radio',
        displayOrder: 0,
        options: [
          { label: 'Excellent', value: 'excellent', score: 0 },
          { label: 'Good', value: 'good', score: 1 },
          { label: 'Fair', value: 'fair', score: 2 },
          { label: 'Poor', value: 'poor', score: 3 },
        ],
      },
      {
        questionText: 'Do you feel unsteady when standing up from a chair?',
        questionType: 'yesno',
        displayOrder: 1,
        options: [
          { label: 'Yes', value: 'yes', score: 2 },
          { label: 'No', value: 'no', score: 0 },
        ],
      },
      {
        questionText: 'Do you use a cane, walker, or other mobility aid?',
        questionType: 'yesno',
        displayOrder: 2,
        options: [
          { label: 'Yes', value: 'yes', score: 2 },
          { label: 'No', value: 'no', score: 0 },
        ],
      },
    ],
  },
  {
    title: 'Medications & Vision',
    description: 'Certain medications and uncorrected vision problems both raise fall risk.',
    displayOrder: 2,
    questions: [
      {
        questionText: 'How many prescription medications do you take daily?',
        questionType: 'numeric',
        displayOrder: 0,
        numericConfig: {
          min: 0,
          max: 20,
          step: 1,
          unit: 'medications',
          scoreBands: [
            { min: 0, max: 3, score: 0 },
            { min: 4, max: 6, score: 1 },
            { min: 7, max: 20, score: 2 },
          ],
        },
      },
      {
        questionText: 'Have you had a vision problem (blurry vision, cataracts, glaucoma) in the past year?',
        questionType: 'yesno',
        displayOrder: 1,
        options: [
          { label: 'Yes', value: 'yes', score: 1 },
          { label: 'No', value: 'no', score: 0 },
        ],
      },
    ],
  },
  {
    title: 'Home & Lifestyle',
    description: 'Home hazards and fear of falling both independently increase fall risk.',
    displayOrder: 3,
    questions: [
      {
        questionText: 'Which of the following apply to your home?',
        questionType: 'checkbox',
        displayOrder: 0,
        required: false,
        options: [
          { label: 'Loose rugs or clutter on the floor', value: 'clutter', score: 1 },
          { label: 'Poor lighting in hallways or stairs', value: 'lighting', score: 1 },
          { label: 'No grab bars in the bathroom', value: 'no-grab-bars', score: 1 },
          { label: 'None of the above', value: 'none', score: 0 },
        ],
      },
      {
        questionText: 'Do you feel afraid of falling during daily activities?',
        questionType: 'yesno',
        displayOrder: 1,
        options: [
          { label: 'Yes', value: 'yes', score: 1 },
          { label: 'No', value: 'no', score: 0 },
        ],
      },
    ],
  },
];

const RESULT_BANDS = [
  {
    minScore: 0,
    maxScore: 5,
    label: 'Low Fall Risk',
    description: 'Your responses suggest a low risk of falling right now — keep up the habits that are working.',
    recommendations: [
      'Continue regular physical activity to maintain strength and balance.',
      'Have your vision checked annually.',
      'Keep your home well-lit and free of clutter.',
    ],
    displayOrder: 0,
  },
  {
    minScore: 6,
    maxScore: 11,
    label: 'Moderate Fall Risk',
    description: 'Your responses suggest a moderate risk of falling — a few changes could meaningfully lower it.',
    recommendations: [
      'Ask your doctor about a balance and strength assessment.',
      'Review your medications with your doctor or pharmacist.',
      'Add grab bars in the bathroom and improve lighting on stairs.',
      'Consider a supervised balance or strength training program.',
    ],
    displayOrder: 1,
  },
  {
    minScore: 12,
    maxScore: 30,
    label: 'High Fall Risk',
    description: 'Your responses suggest a high risk of falling — please talk to a doctor soon.',
    recommendations: [
      'Talk to your doctor about a formal falls risk assessment.',
      'Ask about a physical therapy referral for balance and strength training.',
      'Review every medication you take with your doctor or pharmacist.',
      'Install grab bars, improve lighting, and remove loose rugs at home.',
      'Consider a mobility aid if you haven’t already, and have it properly fitted.',
    ],
    displayOrder: 2,
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);

  const existingTool = await Tool.findOne({ slug: TOOL_SLUG });
  if (existingTool) {
    console.log(`Tool "${TOOL_SLUG}" already exists (${existingTool._id}). Skipping.`);
    await mongoose.disconnect();
    return;
  }

  let category = await ToolCategory.findOne({ slug: 'health-assessments' });
  if (!category) {
    category = await ToolCategory.create({
      name: 'Health Assessments',
      slug: 'health-assessments',
      description: 'Free, doctor-informed assessments and risk calculators.',
      displayOrder: 0,
      isActive: true,
    });
    console.log(`Created ToolCategory "Health Assessments" (${category._id})`);
  } else {
    console.log(`ToolCategory "Health Assessments" already exists (${category._id})`);
  }

  const tool = await Tool.create({
    title: 'Fall Risk Assessment Calculator',
    slug: TOOL_SLUG,
    description:
      'Estimates your personal fall risk based on fall history, balance, medications, vision, and home hazards.',
    longDescription:
      'Falls are the leading cause of injury among adults over 50. This short assessment walks through the ' +
      'factors doctors most commonly screen for — recent falls, balance and mobility, medications, vision, and ' +
      'home hazards — and gives you a personalized risk level with practical next steps.',
    category: category._id,
    tags: ['fall risk', 'balance', 'mobility', 'seniors'],
    toolType: 'assessment',
    disclaimer:
      'This tool is for educational purposes only and does not replace professional medical advice. ' +
      'Please consult your doctor about your personal fall risk.',
    estimatedMinutes: 5,
    displayOrder: 0,
    featured: true,
    accessLevel: 'OTP',
    status: 'published',
    publishedAt: new Date(),
  });
  console.log(`Created Tool "Fall Risk Assessment Calculator" (${tool._id})`);

  for (const sectionData of SECTIONS) {
    const { questions, ...sectionFields } = sectionData;
    // eslint-disable-next-line no-await-in-loop
    const section = await ToolSection.create({ ...sectionFields, tool: tool._id });
    console.log(`  Created section "${section.title}" (${section._id})`);

    for (const questionData of questions) {
      // eslint-disable-next-line no-await-in-loop
      const question = await ToolQuestion.create({
        ...questionData,
        section: section._id,
        tool: tool._id,
      });
      console.log(`    Created question "${question.questionText}" (${question._id})`);
    }
  }

  for (const bandData of RESULT_BANDS) {
    // eslint-disable-next-line no-await-in-loop
    const band = await ToolResultBand.create({ ...bandData, tool: tool._id });
    console.log(`  Created result band "${band.label}" (${band._id})`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to seed the Fall Risk Assessment Calculator:', err);
  process.exit(1);
});
