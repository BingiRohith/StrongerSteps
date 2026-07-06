import { Calendar, Building2, Video, TrendingUp, Scale, MapPin, ArrowRight, Clock } from 'lucide-react';
import { Button, Eyebrow, SectionHeading, Badge } from '@/components/ui';
import ComingSoonCard from '@/components/ComingSoonCard';
import StepDivider from '@/components/StepDivider';

const WORKSHOPS = [
  { title: 'Fall Prevention & Balance Workshop', date: 'Date to be announced', description: 'Simple daily exercises to improve balance and reduce fall risk at home.' },
  { title: 'Nutrition After 50: Eating for Strength', date: 'Date to be announced', description: 'Build a plate that supports muscle, bones, and energy — the Indian way.' },
  { title: '10-Day Stair Challenge Kickoff', date: 'Date to be announced', description: 'A friendly community challenge to rebuild stair confidence, one flight at a time.' },
  { title: 'Caregiver Conversations: Supporting Aging Parents', date: 'Date to be announced', description: 'A guided session for families on having open, supportive conversations about aging.' },
];

const WORKSHOP_LOCATIONS = [
  {
    name: 'Gachibowli',
    detail: 'Hyderabad',
    description: 'Our western Hyderabad centre — accessible from Madhapur, Kondapur, and Narsingi.',
  },
  {
    name: 'Saket Pranaam',
    detail: 'Kompally, Hyderabad',
    description: 'Serving the northern Hyderabad corridor — easy access from Alwal, Secunderabad, and Medchal.',
  },
];

const ONLINE_PROGRAMS = [
  { title: 'Healthy Aging Diary', duration: '2-Week Programme', description: 'A guided daily diary to build awareness of your movement, sleep, nutrition, and energy — the first step to lasting change.' },
  { title: 'Medicine Organisation', duration: '2-Week Programme', description: 'A practical programme to organise your medications, understand what you\'re taking, and avoid dangerous interactions.' },
  { title: 'Digital Seniors', duration: '2-Week Programme', description: 'Learn to use your smartphone, video calls, and health apps confidently — so you can stay connected with family and access care easily.' },
  { title: 'Stronger Steps Companion', duration: '4-Week Programme', description: 'A structured 4-week companion programme to build the habits of a stronger, more independent life — guided step by step.' },
  { title: 'Home Safety Companion', duration: '4-Week Programme', description: 'Transform your home into a safer space. Covers fall hazards, bathroom safety, lighting, and emergency preparedness.' },
  { title: 'Life Administration', duration: '4-Week Programme', description: 'Practical guidance on managing documents, healthcare records, financial basics, and life planning as you age.' },
  { title: 'Independence Planner', duration: '4-Week Programme', description: 'Build a personal roadmap for maintaining independence — covering movement, social life, daily tasks, and support systems.' },
  { title: 'Fall Prevention', duration: '8-Week Programme', description: 'Our most comprehensive fall prevention programme. Balance, strength, home safety, medication review, and confidence — all in eight guided weeks.' },
];

export default function ProgramsPage() {
  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Programs</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Programs designed for stronger, more confident years
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            From in-person workshops to online companion programmes, every programme is built around one idea: small, consistent steps lead to lasting strength.
          </p>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Workshops */}
      <section id="workshops" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Workshops" title="Upcoming sessions" description="Hands-on, in-person sessions led by our founding doctors and health educators in Hyderabad." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKSHOPS.map(({ title, date, description }) => (
              <div key={title} className="flex flex-col rounded-xl2 bg-white p-6 shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-dark">
                  <Calendar size={16} aria-hidden="true" />{date}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold text-primary-dark">{title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{description}</p>
                <Button href="/join#workshops" variant="outline" className="mt-5">Register Interest</Button>
              </div>
            ))}
          </div>

          {/* Locations */}
          <div className="mt-12">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-primary">Workshop Locations</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {WORKSHOP_LOCATIONS.map(({ name, detail, description }) => (
                <div key={name} className="flex items-start gap-4 rounded-xl2 bg-white p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <MapPin size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-display font-bold text-primary-dark">{name}</p>
                    <p className="text-sm text-accent-dark font-semibold">{detail}</p>
                    <p className="mt-1 text-sm text-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Offline Programs */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Offline Programs" title="In-person at our gym" description="Structured sessions at our partner gym facilities — led by specialists in strength and mobility for adults 50+." />
          <div className="grid gap-6 sm:grid-cols-1 md:max-w-sm">
            <ComingSoonCard icon={Building2} title="Gym Programs" description="In-person strength and balance classes at our partner gyms in Hyderabad, led by trainers experienced in working with older adults." />
          </div>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Online Programs */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Online Programs" title="Join from anywhere" description="Structured, self-paced programmes you can follow from home — each with a clear duration and outcome." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ONLINE_PROGRAMS.map(({ title, duration, description }) => (
              <div key={title} className="flex flex-col rounded-xl2 bg-white p-6 shadow-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit">
                  <Clock size={12} aria-hidden="true" />
                  {duration}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold text-primary-dark">{title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{description}</p>
                <Badge tone="outline" className="mt-4">Coming Soon</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
