import {
  BookOpen,
  GraduationCap,
  Image as ImageIcon,
  Wrench,
  FolderOpen,
  ShieldAlert,
  Activity,
  Brain,
  Scale,
  Dumbbell,
  Footprints,
  Armchair,
  Quote,
} from 'lucide-react';
import Link from 'next/link';
import { Eyebrow, SectionHeading } from '@/components/ui';
import ComingSoonCard from '@/components/ComingSoonCard';
import CourseCard from '@/components/courses/CourseCard';
import ResourceCard from '@/components/resources/ResourceCard';
import BlogGrid from '@/components/blog/BlogGrid';
import InfographicsGrid from '@/components/infographics/InfographicsGrid';
import StepDivider from '@/components/StepDivider';
import { getPublishedBlogs, getBlogCategories } from '@/lib/publicBlogs';
import { getPublishedInfographics, getInfographicCategories } from '@/lib/publicInfographics';
import { getPublishedCourses } from '@/lib/publicCourses';
import { getFeaturedResources } from '@/lib/publicResources';

// This page now reads published blogs live from MongoDB (see the Blogs
// section below), so it can't be statically cached at build time — same
// reasoning as `app/api/blogs/route.js` and the blog detail page.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Knowledge Center',
  description:
    'Explore blogs, infographics, and guides on healthy aging, mobility, nutrition, and independent living from Stronger Steps.',
  alternates: { canonical: '/knowledge-center' },
  openGraph: { title: 'Knowledge Center | Stronger Steps', url: '/knowledge-center' },
};

const SUB_NAV = [
  { href: '#blogs', label: 'Blogs', icon: BookOpen },
  { href: '#courses', label: 'Courses', icon: GraduationCap },
  { href: '#infographics', label: 'Infographics', icon: ImageIcon },
  { href: '#tools', label: 'Tools', icon: Wrench },
  { href: '#resources', label: 'Resources', icon: FolderOpen },
];

const TOOLS = [
  {
    icon: ShieldAlert,
    title: 'Fall Risk Predictor Calculator',
    description: 'Estimates your personal fall likelihood based on balance, medications, previous falls, vision, and mobility. The single most important tool we offer.',
    badge: 'Priority Tool',
  },
  {
    icon: Scale,
    title: 'BMI Calculator',
    description: 'Calculate your Body Mass Index and understand what it means for your health specifically after 50.',
  },
  {
    icon: Activity,
    title: 'HOMA-IR Calculator',
    description: 'Measures insulin resistance — a key indicator of metabolic health and diabetes risk in older adults.',
  },
  {
    icon: Brain,
    title: 'ASCVD Risk Score',
    description: 'Estimates your 10-year risk of a cardiovascular event, helping you and your doctor make better prevention decisions.',
  },
  {
    icon: Dumbbell,
    title: 'Beers Criteria Risk Calculator',
    description: 'Screens your current medications against the Beers Criteria — a clinically validated list of drugs that may be unsafe for adults 65+.',
  },
  {
    icon: Footprints,
    title: 'G8 Geriatric Screening Tool',
    description: 'An 8-question screening tool used to assess overall health status in older adults — fast, validated, and clinically proven.',
  },
  {
    icon: Armchair,
    title: 'Vulnerable Elders Survey (VES)',
    description: 'A standardised survey to identify older adults at risk of functional decline and health deterioration.',
  },
  {
    icon: Brain,
    title: 'Digital Geriatric Depression Scale',
    description: 'A validated screening questionnaire for depression in older adults — private, fast, and clinically meaningful.',
  },
  {
    icon: Activity,
    title: 'Dementia Risk Calculator',
    description: 'Estimates your risk of developing dementia based on age, lifestyle, and medical factors — with guidance on what to do next.',
  },
];

export default async function KnowledgeCenterPage() {
  const [
    { blogs, pagination },
    categories,
    { infographics, pagination: infographicsPagination },
    infographicCategories,
    { courses },
    featuredResources,
  ] = await Promise.all([
    getPublishedBlogs({ page: 1, limit: 9 }),
    getBlogCategories(),
    getPublishedInfographics({ page: 1, limit: 18 }),
    getInfographicCategories(),
    getPublishedCourses({ page: 1, limit: 6, sort: 'newest' }),
    getFeaturedResources(6),
  ]);

  return (
    <>
      {/* Header */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Knowledge Center</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Your guide to healthy aging, built by doctors, made for you
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Blogs, courses, infographics, and free tools — everything you need to understand
            your health and take the next step with confidence.
          </p>

          {/* Education Quote */}
          <div className="mt-8 flex items-start gap-4 rounded-xl2 border border-line bg-white p-6 md:max-w-2xl">
            <Quote size={28} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <blockquote>
              <p className="font-display text-lg font-semibold leading-snug text-primary-dark">
                &ldquo;The best investment you can make in your health is understanding it.&rdquo;
              </p>
              <footer className="mt-2 text-sm text-muted">
                — The Stronger Steps philosophy
              </footer>
            </blockquote>
          </div>

          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Knowledge Center sections">
            {SUB_NAV.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-primary-dark transition-colors hover:border-primary hover:bg-sage"
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Blogs */}
      <section id="blogs" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="Blogs"
            title="Browse by topic"
            description="Short, practical articles on the challenges that matter most after 50. Search by keyword or filter by topic to get started."
          />
          <BlogGrid initialBlogs={blogs} initialPagination={pagination} categories={categories} />
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Courses — Sprint 19.2: real Course model, replacing the Sprint 18
          hardcoded FREE_COURSES/PREMIUM_COURSES placeholder arrays. This
          section stays the entry point per docs/13_DECISIONS.md (Sprint 18
          decided Courses belongs in the Knowledge Center, not a new
          homepage section); Sprint 19.2's brief is the "explicit new
          instruction" that authorizes a real, dedicated /courses listing +
          detail page, linked from here rather than added as a new
          top-level header nav item. */}
      <section id="courses" className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Courses"
              title="Structured learning, self-paced"
              description="Courses designed with our founding doctors — browse the full catalog or start with what's new below."
            />
            <Link
              href="/courses"
              className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-primary-dark hover:border-primary hover:text-primary md:mb-14"
            >
              View all courses
            </Link>
          </div>

          {courses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Courses are on their way — check back soon.</p>
          )}
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Infographics */}
      <section id="infographics" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="Infographics"
            title="Simple visuals, made for sharing"
            description="Designed to be forwarded — save these to your phone or share them to a family WhatsApp group."
          />
          <InfographicsGrid
            initialInfographics={infographics}
            initialPagination={infographicsPagination}
            categories={infographicCategories}
          />
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Tools */}
      <section id="tools" className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="Tools — what sets us apart"
            title="Free assessments you can take in minutes"
            description="Simple, doctor-informed tools that help you understand your own risk factors — no appointment needed."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <ComingSoonCard
                key={tool.title}
                badgeLabel={tool.badge || 'Coming Soon'}
                tone={tool.badge ? 'primary' : 'accent'}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
              />
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Resources — Sprint 19.3: real Resource model, replacing the
          hardcoded RESOURCES placeholder array. This section stays the
          entry point per the same "don't split across two pages"
          precedent Sprint 19.2 established for Courses
          (docs/13_DECISIONS.md) — a dedicated /resources listing + detail
          page, linked from here rather than a new top-level header nav
          item. */}
      <section id="resources" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Resources"
              title="Guides, checklists, and downloads"
              description="Clinically validated resources sourced from geriatric practice — browse the full library or start with what's featured below."
            />
            <Link
              href="/resources"
              className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-primary-dark hover:border-primary hover:text-primary md:mb-14"
            >
              View all resources
            </Link>
          </div>

          {featuredResources.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredResources.map((resource) => (
                <ResourceCard key={resource._id} resource={resource} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Resources are on their way — check back soon.</p>
          )}
        </div>
      </section>
    </>
  );
}
