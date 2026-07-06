import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';
import { Badge, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import BlogCard, { formatBlogDate } from '@/components/blog/BlogCard';
import BlogPrevNext from '@/components/blog/BlogPrevNext';
import ShareButtons from '@/components/blog/ShareButtons';
import { getBlogBySlug, getAdjacentBlogs, getRelatedBlogs } from '@/lib/publicBlogs';

// Reads live from MongoDB on every request — blogs are published/edited from
// the admin panel at any time, so this page can't be statically cached at
// build time (same reasoning as `app/api/blogs/route.js`).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const blog = await getBlogBySlug(params.slug);

  if (!blog) {
    return { title: 'Article not found | Stronger Steps' };
  }

  const title = blog.seo?.title || blog.title;
  const description = blog.seo?.metaDescription || blog.excerpt || undefined;
  const ogImages = blog.coverImage?.url ? [{ url: blog.coverImage.url, alt: blog.coverImage.alt || blog.title }] : undefined;

  return {
    title: `${title} | Stronger Steps`,
    description,
    alternates: {
      canonical: `/knowledge-center/blogs/${blog.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: blog.publishedAt || undefined,
      images: ogImages,
    },
    twitter: {
      card: ogImages ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImages,
    },
  };
}

export default async function BlogDetailPage({ params }) {
  const blog = await getBlogBySlug(params.slug);

  if (!blog) {
    notFound();
  }

  const [{ prev, next }, related] = await Promise.all([
    getAdjacentBlogs(blog),
    getRelatedBlogs(blog, 3),
  ]);

  return (
    <>
      {/* Header */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Link
            href="/knowledge-center#blogs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Knowledge Center
          </Link>

          <div className="mt-6 max-w-2xl">
            {blog.category?.name && <Badge tone="accent">{blog.category.name}</Badge>}
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-primary-dark md:text-4xl">
              {blog.title}
            </h1>
            {blog.excerpt && <p className="mt-4 text-lg text-muted">{blog.excerpt}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} aria-hidden="true" />
                {blog.readingTime} min read
              </span>
              {blog.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={15} aria-hidden="true" />
                  {formatBlogDate(blog.publishedAt)}
                </span>
              )}
              {blog.author?.name && <span>By {blog.author.name}</span>}
            </div>
          </div>

          {blog.coverImage?.url && (
            <div className="mt-10 aspect-[16/8] w-full overflow-hidden rounded-xl2 bg-sage">
              {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image */}
              <img
                src={blog.coverImage.url}
                alt={blog.coverImage.alt || blog.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 pb-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_260px]">
            <article
              className="max-w-none text-base leading-relaxed text-ink [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-primary-dark [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-primary-dark [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            <aside className="lg:sticky lg:top-8 lg:h-fit">
              <div className="rounded-xl2 border border-line bg-white p-5">
                <ShareButtons title={blog.title} />
              </div>
            </aside>
          </div>

          <div className="mt-6 border-t border-line pt-6 lg:hidden">
            <ShareButtons title={blog.title} />
          </div>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Prev / Next */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-12">
          <BlogPrevNext prev={prev} next={next} />
        </div>
      </section>

      {/* Related blogs */}
      {related.length > 0 && (
        <>
          <StepDivider from="#E6EEE4" to="#FBF7EF" flip />
          <section className="bg-bg">
            <div className="mx-auto max-w-content px-6 py-16 md:py-20">
              <SectionHeading
                eyebrow="Keep reading"
                title="Related articles"
                description="More on this topic from the Stronger Steps Knowledge Center."
              />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <BlogCard key={item._id} blog={item} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
