import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Globe, User } from 'lucide-react';
import { Badge, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import ResourceCard from '@/components/resources/ResourceCard';
import ResourceDownloadsSection from '@/components/resources/ResourceDownloadsSection';
import { getResourceBySlug, getRelatedResources } from '@/lib/publicResources';
import { getCurrentActor } from '@/lib/access/actor';
import { annotateResourceAccess } from '@/lib/resourceAccess';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const resource = await getResourceBySlug(params.slug);
  if (!resource) return { title: 'Resource not found' };

  const title = resource.seo?.title || resource.title;
  const description = resource.seo?.metaDescription || resource.description || undefined;
  const ogImages = resource.thumbnail?.url
    ? [{ url: resource.thumbnail.url, alt: resource.thumbnail.alt || resource.title }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/resources/${resource.slug}` },
    openGraph: { title, description, type: 'article', images: ogImages },
    twitter: { card: ogImages ? 'summary_large_image' : 'summary', title, description, images: ogImages },
  };
}

export default async function ResourceDetailPage({ params }) {
  const resource = await getResourceBySlug(params.slug);
  if (!resource) notFound();

  const actor = await getCurrentActor();
  const annotated = annotateResourceAccess(resource, actor);
  const related = await getRelatedResources(resource, 3);

  // Schema.org CreativeWork structured data — Sprint 19.3's "SEO:
  // Structured Data where appropriate" requirement, same JSON-LD pattern
  // Course uses (app/courses/[slug]/page.js) with the closest matching
  // schema.org type for a mixed-media downloadable resource.
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: resource.title,
    description: resource.description || resource.seo?.metaDescription || undefined,
    ...(resource.author ? { author: { '@type': 'Person', name: resource.author } } : {}),
    ...(resource.language ? { inLanguage: resource.language } : {}),
    publisher: { '@type': 'Organization', name: 'Stronger Steps' },
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger -- static, server-generated JSON-LD, no user input reflected unescaped */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Link href="/resources" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Resources
          </Link>

          <div className="mt-6 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {resource.category?.name && <Badge tone="accent">{resource.category.name}</Badge>}
              {resource.accessLevel !== 'PUBLIC' && <Badge tone="sage">{resource.accessLevel}</Badge>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-primary-dark md:text-4xl">
              {resource.title}
            </h1>
            {resource.description && <p className="mt-4 text-lg text-muted">{resource.description}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted">
              {resource.author && (
                <span className="inline-flex items-center gap-1.5">
                  <User size={15} aria-hidden="true" />
                  {resource.author}
                </span>
              )}
              {resource.estimatedReadingTime > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} aria-hidden="true" />
                  {resource.estimatedReadingTime} min read
                </span>
              )}
              {resource.language && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe size={15} aria-hidden="true" />
                  {resource.language}
                </span>
              )}
              <span>
                {resource.files?.length || 0} file{resource.files?.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {(resource.banner?.url || resource.thumbnail?.url) && (
            <div className="mt-10 aspect-[16/6] w-full overflow-hidden rounded-xl2 bg-sage">
              {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image */}
              <img
                src={resource.banner?.url || resource.thumbnail?.url}
                alt={resource.banner?.alt || resource.thumbnail?.alt || resource.title}
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
              {resource.longDescription && (
                <p className="mb-8 whitespace-pre-line text-base leading-relaxed text-ink">
                  {resource.longDescription}
                </p>
              )}

              <h2 className="mb-4 font-display text-2xl font-bold text-primary-dark">Downloads</h2>
              <ResourceDownloadsSection resourceId={resource._id} files={annotated.files} />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
              {resource.tags?.length > 0 && (
                <div className="rounded-xl2 border border-line bg-white p-6">
                  <h2 className="mb-3 font-display text-sm font-bold text-primary-dark">Tags</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.tags.map((tag) => (
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
              <SectionHeading eyebrow="Keep exploring" title="More resources like this" description="Other resources from the same category." />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <ResourceCard key={item._id} resource={item} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
