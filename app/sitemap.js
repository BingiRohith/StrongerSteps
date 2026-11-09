import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import Recipe from '@/models/Recipe';
import Course from '@/models/Course';
import Resource from '@/models/Resource';
import Tool from '@/models/Tool';

// Published content comes from Atlas at request time, including on staging.
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const STATIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/join', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/products', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/programs', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/recipes', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/knowledge-center', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/courses', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/resources', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/tools', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/booking-history', priority: 0.3, changeFrequency: 'monthly' },
];

/**
 * Dynamic sitemap (Sprint 17, extended Sprint 19.6) — static routes plus
 * every published Blog/Recipe/Course/Resource/Tool slug, queried directly
 * (not through the paginated lib/public*.js helpers, which cap `limit` for
 * UI pagination) so the sitemap stays exhaustive as content grows. Course/
 * Resource/Tool detail pages are publicly reachable regardless of
 * accessLevel (OTP/MEMBER/PURCHASED gates specific lessons/files/results,
 * not the listing page itself), so no accessLevel filter is applied here.
 */
export default async function sitemap() {
  await connectDB();

  const [blogs, recipes, courses, resources, tools] = await Promise.all([
    Blog.find({ status: 'published' }).select('slug updatedAt').lean(),
    Recipe.find({ status: 'published' }).select('slug updatedAt').lean(),
    Course.find({ status: 'published' }).select('slug updatedAt').lean(),
    Resource.find({ status: 'published', deletedAt: null }).select('slug updatedAt').lean(),
    Tool.find({ status: 'published' }).select('slug updatedAt').lean(),
  ]);

  const staticEntries = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const blogEntries = blogs.map((blog) => ({
    url: `${SITE_URL}/knowledge-center/blogs/${blog.slug}`,
    lastModified: blog.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const recipeEntries = recipes.map((recipe) => ({
    url: `${SITE_URL}/recipes/${recipe.slug}`,
    lastModified: recipe.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const courseEntries = courses.map((course) => ({
    url: `${SITE_URL}/courses/${course.slug}`,
    lastModified: course.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const resourceEntries = resources.map((resource) => ({
    url: `${SITE_URL}/resources/${resource.slug}`,
    lastModified: resource.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const toolEntries = tools.map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: tool.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...blogEntries,
    ...recipeEntries,
    ...courseEntries,
    ...resourceEntries,
    ...toolEntries,
  ];
}
