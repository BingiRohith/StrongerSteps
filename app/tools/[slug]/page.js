import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { Badge, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import ToolCard from '@/components/tools/ToolCard';
import ToolAssessmentForm from '@/components/tools/ToolAssessmentForm';
import { getToolBySlug, getRelatedTools } from '@/lib/publicTools';
import { toolTypeLabel } from '@/lib/toolOptions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) return { title: 'Tool not found' };

  const title = tool.seo?.title || tool.title;
  const description = tool.seo?.metaDescription || tool.description || undefined;
  const ogImages = tool.thumbnail?.url
    ? [{ url: tool.thumbnail.url, alt: tool.thumbnail.alt || tool.title }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: { title, description, type: 'website', images: ogImages },
    twitter: { card: ogImages ? 'summary_large_image' : 'summary', title, description, images: ogImages },
  };
}

/**
 * Sprint 19.4 — the real Tool detail + assessment page, mirroring
 * app/resources/[slug]/page.js's layout. Sections/questions are always
 * fully rendered (see lib/publicTools.js's getToolBySlug header comment) —
 * the access gate only applies inside ToolAssessmentForm's submit flow.
 */
export default async function ToolDetailPage({ params }) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) notFound();

  const related = await getRelatedTools(tool, 3);

  // Schema.org structured data — closest matching type for a free,
  // browser-based health assessment/calculator, same "reasonable pick, not
  // hardcoded per-tool" approach app/resources/[slug]/page.js/app/courses/[slug]/page.js use.
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    description: tool.description || tool.seo?.metaDescription || undefined,
    applicationCategory: 'HealthApplication',
    publisher: { '@type': 'Organization', name: 'Stronger Steps' },
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger -- static, server-generated JSON-LD, no user input reflected unescaped */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Link href="/tools" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Tools
          </Link>

          <div className="mt-6 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {tool.category?.name && <Badge tone="accent">{tool.category.name}</Badge>}
              <Badge tone="sage">{toolTypeLabel(tool.toolType)}</Badge>
              {tool.accessLevel !== 'PUBLIC' && <Badge tone="sage">{tool.accessLevel}</Badge>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-primary-dark md:text-4xl">
              {tool.title}
            </h1>
            {tool.description && <p className="mt-4 text-lg text-muted">{tool.description}</p>}

            {tool.estimatedMinutes > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} aria-hidden="true" />
                  About {tool.estimatedMinutes} min
                </span>
              </div>
            )}
          </div>

          {(tool.banner?.url || tool.thumbnail?.url) && (
            <div className="mt-10 aspect-[16/6] w-full overflow-hidden rounded-xl2 bg-sage">
              {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image */}
              <img
                src={tool.banner?.url || tool.thumbnail?.url}
                alt={tool.banner?.alt || tool.thumbnail?.alt || tool.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 pb-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            <div>
              {tool.longDescription && (
                <p className="mb-8 whitespace-pre-line text-base leading-relaxed text-ink">
                  {tool.longDescription}
                </p>
              )}

              <ToolAssessmentForm tool={tool} />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
              {tool.tags?.length > 0 && (
                <div className="rounded-xl2 border border-line bg-white p-6">
                  <h2 className="mb-3 font-display text-sm font-bold text-primary-dark">Tags</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-sage px-2.5 py-1 text-xs font-semibold capitalize text-primary-dark">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <>
          <StepDivider from="#FBF7EF" to="#E6EEE4" />
          <section className="bg-sage">
            <div className="mx-auto max-w-content px-6 py-16 md:py-20">
              <SectionHeading eyebrow="Keep exploring" title="More tools like this" description="Other tools from the same category." />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <ToolCard key={item._id} tool={item} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
