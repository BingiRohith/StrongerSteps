import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import Recipe from '@/models/Recipe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const STATIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/join', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/products', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/programs', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/recipes', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/knowledge-center', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/booking-history', priority: 0.3, changeFrequency: 'monthly' },
];

/**
 * Dynamic sitemap (Sprint 17) — static routes plus every published
 * blog/recipe slug, queried directly (not through the paginated
 * lib/publicBlogs.js / lib/publicRecipes.js helpers, which cap `limit` for
 * UI pagination) so the sitemap stays exhaustive as content grows.
 */
export default async function sitemap() {
  await connectDB();

  const [blogs, recipes] = await Promise.all([
    Blog.find({ status: 'published' }).select('slug updatedAt').lean(),
    Recipe.find({ status: 'published' }).select('slug updatedAt').lean(),
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

  return [...staticEntries, ...blogEntries, ...recipeEntries];
}
