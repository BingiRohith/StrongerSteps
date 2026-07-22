import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolCategory from '@/models/ToolCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import ToolSection from '@/models/ToolSection';
import ToolQuestion from '@/models/ToolQuestion';
import ToolResultBand from '@/models/ToolResultBand';

/**
 * Read-only query helpers for the *public* Tools pages (`/tools`,
 * `/tools/[slug]`) and the public `/api/tools` route. Every query here is
 * hard-scoped to `status: 'published'` — drafts are never reachable from
 * the public site. Mirrors the lib/publicResources.js pattern exactly.
 *
 * Unlike Resources (which redacts individual file content based on
 * access), a Tool's sections/questions are always fully visible here — the
 * gate is on *submitting* the assessment for a scored result, not on
 * seeing the blank form (see app/api/tools/[slug]/attempt/route.js and
 * lib/verification/resourceRegistry.js's `tool` entry). `resultBands` are
 * intentionally NOT returned by getToolBySlug() — recommendations should
 * only be revealed after scoring, not visible upfront on the public page.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

const SORT_OPTIONS = {
  'title-asc': { title: 1 },
  newest: { publishedAt: -1 },
  featured: { featured: -1, displayOrder: 1 },
};
const DEFAULT_SORT = { displayOrder: 1, title: 1 };

/** Published tools with optional category (slug)/tag/toolType/text-search/accessLevel filters, sort, and pagination. */
export async function getPublishedTools({
  category = '',
  tag = '',
  toolType = '',
  search = '',
  accessLevel = '',
  featured = false,
  sort = '',
  page = 1,
  limit = 12,
} = {}) {
  await connectDB();

  const query = { status: 'published' };

  if (category) {
    const categoryDoc = await ToolCategory.findOne({ slug: category }).select('_id').lean();
    query.category = categoryDoc ? categoryDoc._id : null; // no match -> empty results, not "ignore filter"
  }
  if (tag) query.tags = tag.trim().toLowerCase();
  if (toolType) query.toolType = toolType;
  if (accessLevel) query.accessLevel = accessLevel;
  if (featured) query.featured = true;
  if (search?.trim()) query.$text = { $search: search.trim() };

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(48, Math.max(1, Number(limit) || 12));
  const sortSpec = SORT_OPTIONS[sort] || DEFAULT_SORT;

  const [tools, total] = await Promise.all([
    Tool.find(query)
      .populate('category', 'name slug')
      .sort(sortSpec)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Tool.countDocuments(query),
  ]);

  return {
    tools: serialize(tools),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/** Up to `limit` featured, published tools — powers the Tools listing page and the Knowledge Center section. */
export async function getFeaturedTools(limit = 6) {
  await connectDB();

  const tools = await Tool.find({ status: 'published', featured: true })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(tools);
}

/** Active tool categories, admin-ordered — same "curated nav, not derived facet" convention as Resource/Course Categories. */
export async function getActiveToolCategories() {
  await connectDB();

  const categories = await ToolCategory.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return serialize(categories);
}

/**
 * A single published tool by slug, with its sections and questions
 * attached (nested: `sections[].questions[]`), ready for the public
 * assessment form.
 */
export async function getToolBySlug(slug) {
  await connectDB();

  const tool = await Tool.findOne({ slug, status: 'published' })
    .populate('category', 'name slug')
    .lean();
  if (!tool) return null;

  const [sections, questions] = await Promise.all([
    ToolSection.find({ tool: tool._id }).sort({ displayOrder: 1 }).lean(),
    ToolQuestion.find({ tool: tool._id }).sort({ displayOrder: 1 }).lean(),
  ]);

  const questionsBySection = new Map();
  for (const question of questions) {
    const key = String(question.section);
    if (!questionsBySection.has(key)) questionsBySection.set(key, []);
    questionsBySection.get(key).push(question);
  }

  tool.sections = sections.map((section) => ({
    ...section,
    questions: questionsBySection.get(String(section._id)) || [],
  }));

  return serialize(tool);
}

/** Every question for a tool (flat, not nested by section) — used server-side by the attempt/scoring route. */
export async function getToolQuestionsFlat(toolId) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(toolId)) return [];

  const questions = await ToolQuestion.find({ tool: toolId }).lean();
  return serialize(questions);
}

/** Every result band for a tool, ordered by score range — used server-side by the attempt/scoring route. */
export async function getToolResultBands(toolId) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(toolId)) return [];

  const resultBands = await ToolResultBand.find({ tool: toolId }).sort({ minScore: 1 }).lean();
  return serialize(resultBands);
}

/** Up to `limit` other published tools in the same category. */
export async function getRelatedTools(tool, limit = 3) {
  await connectDB();

  const categoryId = tool?.category?._id || tool?.category;
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) return [];

  const related = await Tool.find({
    status: 'published',
    category: categoryId,
    slug: { $ne: tool.slug },
  })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(related);
}
