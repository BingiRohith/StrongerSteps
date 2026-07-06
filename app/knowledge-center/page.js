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
  Sparkles,
  Quote,
  FileText,
  Download,
} from 'lucide-react';
import { Badge, Eyebrow, SectionHeading } from '@/components/ui';
import ComingSoonCard from '@/components/ComingSoonCard';
import BlogGrid from '@/components/blog/BlogGrid';
import InfographicsGrid from '@/components/infographics/InfographicsGrid';
import StepDivider from '@/components/StepDivider';
import { getPublishedBlogs, getBlogCategories } from '@/lib/publicBlogs';
import { getPublishedInfographics, getInfographicCategories } from '@/lib/publicInfographics';

// This page now reads published blogs live from MongoDB (see the Blogs
// section below), so it can't be statically cached at build time — same
// reasoning as `app/api/blogs/route.js` and the blog detail page.
export const dynamic = 'force-dynamic';

const SUB_NAV = [
  { href: '#blogs', label: 'Blogs', icon: BookOpen },
  { href: '#courses', label: 'Courses', icon: GraduationCap },
  { href: '#infographics', label: 'Infographics', icon: ImageIcon },
  { href: '#tools', label: 'Tools', icon: Wrench },
  { href: '#resources', label: 'Resources', icon: FolderOpen },
];

const FREE_COURSES = [
  { title: 'Understanding Aging', description: 'The science of what happens to the body after 50 — and what you can realistically do about it.' },
  { title: 'Nutrition Basics in Old Age', description: 'A foundational guide to eating right for strength, bones, and energy as you age.' },
  { title: 'Common Disorders & Red Flag Signs in Old Age', description: 'Know what to look for — the early warning signs that need a doctor\'s attention.' },
  { title: 'Psychology in Old Age', description: 'Understanding mood, memory, motivation, and mental health in later life.' },
  { title: 'Prevention', description: 'The single most powerful thing you can do for your health is prevent problems before they start. Here\'s how.' },
  { title: 'Simple Home Exercises', description: 'Safe, effective exercises you can do in your living room — no equipment needed.' },
];

const PREMIUM_COURSES = [
  { title: 'Stronger Steps 8-Week Certification Programme', description: 'Our flagship guided journey combining exercise, nutrition, mindset, and doctor support — with a certificate on completion.' },
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

const RESOURCES = [
  {
    title: 'Mini-Cog Assessment',
    description: 'A rapid 3-minute cognitive screening tool using a 3-word recall and clock drawing test. Widely used by clinicians to detect cognitive impairment.',
  },
  {
    title: 'GPCOG Assessment',
    description: 'The General Practitioner Assessment of Cognition — a validated, brief cognitive screening tool suitable for use in primary care settings.',
  },
  {
    title: 'Geriatric Depression Scale (GDS)',
    description: 'A 30-item (or 15-item short form) questionnaire designed specifically to screen for depression in older adults.',
  },
  {
    title: 'STEADI Fall Risk Checklist',
    description: 'Developed by the CDC — the Stopping Elderly Accidents, Deaths & Injuries fall-risk screening checklist for older adults.',
  },
  {
    title: 'Timed Up & Go Test (TUG)',
    description: 'A simple timed test measuring balance and walking ability. Stand up from a chair, walk 3 metres, turn around, and return. Widely used in clinical geriatric assessment.',
  },
  {
    title: 'Elderly Health Monitoring Handbook',
    description: 'A practical downloadable handbook for tracking health metrics, medications, appointments, and wellness habits for adults 50+.',
  },
  {
    title: 'Community-Based Assessment Checklist',
    description: 'A structured checklist for evaluating older adults in non-clinical, community settings — ideal for family members and community health workers.',
  },
  {
    title: 'Katz Index of Independence',
    description: 'Assesses a patient\'s functional status by measuring independence in six basic Activities of Daily Living (ADLs): bathing, dressing, toileting, transferring, continence, and feeding.',
  },
  {
    title: 'Mini Nutritional Assessment (MNA)',
    description: 'The gold standard screening and assessment tool for malnutrition in older adults — used in hospitals, nursing homes, and community care worldwide.',
  },
];

export default async function KnowledgeCenterPage() {
  const [{ blogs, pagination }, categories, { infographics, pagination: infographicsPagination }, infographicCategories] =
    await Promise.all([
      getPublishedBlogs({ page: 1, limit: 9 }),
      getBlogCategories(),
      getPublishedInfographics({ page: 1, limit: 18 }),
      getInfographicCategories(),
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

      {/* Courses */}
      <section id="courses" className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="Courses"
            title="Structured learning, free and premium"
            description="Self-paced courses designed with our founding doctors. Join the community to be notified when courses launch."
          />

          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-primary">
            Free Courses
          </h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_COURSES.map((course) => (
              <ComingSoonCard key={course.title} icon={GraduationCap} {...course} />
            ))}
          </div>

          <h3 className="mt-12 font-display text-sm font-semibold uppercase tracking-wide text-accent-dark">
            Premium Course
          </h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PREMIUM_COURSES.map((course) => (
              <ComingSoonCard key={course.title} icon={Sparkles} badgeLabel="Coming Soon" tone="accent" {...course} />
            ))}
          </div>
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

      {/* Resources */}
      <section id="resources" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>Resources</Eyebrow>
            <Badge tone="accent">Printable PDFs</Badge>
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Clinically validated assessments & checklists
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Downloadable PDF resources sourced from clinical geriatric practice — assessments, 
            checklists, and guides used by doctors worldwide, now available for you and your family. 
            PDFs being added shortly.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCES.map((item) => (
              <div key={item.title} className="flex flex-col rounded-xl2 border border-line bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-primary">
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-semibold text-primary-dark">{item.title}</h3>
                    <p className="mt-1 text-xs text-muted">{item.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge tone="outline">PDF Coming Soon</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
