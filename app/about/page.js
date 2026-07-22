import { Award, Milestone, Telescope, ArrowRight } from 'lucide-react';
import { Button, Eyebrow, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import TeamGrid from '@/components/team/TeamGrid';
import { getPublishedTeamMembers } from '@/lib/publicTeam';

export const metadata = {
  title: 'About Us',
  description:
    'Meet the doctors and team behind Stronger Steps — a community platform helping adults 50+ stay strong, independent, and confident.',
  alternates: { canonical: '/about' },
  openGraph: { title: 'About Us | Stronger Steps', url: '/about' },
};

const CREDENTIALS = [
  'Diploma in Geriatric Medicine',
  'Diploma in Palliative Rehabilitation',
  'MCh CTVS',
  'MS ENT',
  'Published papers in the International Journal of Geriatrics',
];

const TIMELINE = [
  { year: '2026', event: 'First healthy-aging workshop held — Stronger Steps begins.' },
  { year: '2026', event: 'StrongerSteps.in launches. Tools, courses, and community features rolling out.' },
];

export default async function AboutPage() {
  const teamMembers = await getPublishedTeamMembers();

  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>About Us</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Two doctors. One shared belief: aging well is possible for everyone.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Stronger Steps was founded by Dr. Nikhil and Dr. Akhila — two Hyderabad-based specialists who saw the same gap in their clinical work: older adults with no trusted, accessible resource for staying strong and independent.
          </p>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Team (Sprint 19.4 — flat card grid, replacing the illustrated
          Organization Tree per client instruction: no tree diagrams, org
          charts, or connector lines) */}
      {teamMembers.length > 0 && (
        <section className="bg-sage">
          <div className="mx-auto max-w-content px-6 py-16 md:py-20">
            <SectionHeading eyebrow="Who we are" title="Meet the team" />
            <TeamGrid initialMembers={teamMembers} />
          </div>
        </section>
      )}

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Credentials */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Credentials" title="Built on clinical expertise" description="Everything we publish and teach is grounded in real medical training and years of clinical practice." />
          <ul className="mt-2 space-y-3">
            {CREDENTIALS.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl2 bg-sage p-4">
                <Award size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-ink">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Timeline */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Our journey" title="How we got here" />
          <ol className="relative border-l-2 border-primary/30 pl-8 space-y-8">
            {TIMELINE.map(({ year, event }, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[2.65rem] flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <Milestone size={14} aria-hidden="true" />
                </span>
                <span className="font-display text-xs font-bold uppercase tracking-widest text-accent-dark">{year}</span>
                <p className="mt-1 text-ink">{event}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#1B3E30" />

      {/* Vision */}
      <section className="bg-primary-dark text-white">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <div className="flex items-start gap-4">
            <Telescope size={36} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <Eyebrow>Our vision</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
                Redefining what it means to age in India
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white/75">
                We're building India\'s most trusted healthy-aging ecosystem — one that treats older adults as active, capable people with the right to expert guidance and a supportive community.
              </p>
              <Button href="/join" variant="accent" className="mt-8">
                Join us on this journey <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
