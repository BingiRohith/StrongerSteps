import {
  Dumbbell,
  Users,
  ShieldAlert,
  BatteryLow,
  Footprints,
  Star,
  ArrowRight,
  Calendar,
  ChevronDown,
  Share2,
  Quote,
  MoveUp,
  MapPin,
  Zap,
  PersonStanding,
  HeartHandshake,
  Plane,
} from 'lucide-react';
import { Button, Badge, Eyebrow, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import HeroSteps from '@/components/HeroSteps';

const WHY_IT_MATTERS = [
  {
    icon: MoveUp,
    title: 'Climbing Stairs',
    description:
      'Struggling with stairs is one of the earliest signs of declining leg strength and mobility — and it\'s often the first thing that limits your independence at home.',
  },
  {
    icon: MapPin,
    title: 'Walking Long Distances',
    description:
      'When walking to the market or a family function becomes an effort, it quietly shrinks your world. We help you rebuild the endurance to go wherever life takes you.',
  },
  {
    icon: PersonStanding,
    title: 'Joint Pains',
    description:
      'Joint discomfort is common after 50, but it doesn\'t have to be permanent. The right movement — done the right way — can reduce pain and improve daily function.',
  },
  {
    icon: BatteryLow,
    title: 'Low Energy',
    description:
      'Fatigue after 50 is often a signal of muscle loss, poor nutrition, or inactivity — all of which can be addressed. More energy means more life.',
  },
  {
    icon: ShieldAlert,
    title: 'Balance',
    description:
      'Falls are the leading cause of injury in older adults. Balance training is one of the most powerful things you can do to stay safe, confident, and independent.',
  },
];

const OUR_VISION = [
  {
    icon: Dumbbell,
    title: 'Strength',
    description: 'Build real, functional strength that lets you lift, carry, climb, and live without limitations.',
  },
  {
    icon: Star,
    title: 'Confidence',
    description: 'Move through the world with the quiet assurance that your body won\'t let you down.',
  },
  {
    icon: Users,
    title: 'Social Life',
    description: 'Stay active in family gatherings, community events, and the moments that matter most.',
  },
  {
    icon: HeartHandshake,
    title: 'Independence',
    description: 'Live life on your own terms — at home, in your neighbourhood, and beyond.',
  },
];

const WHAT_WE_DO = [
  {
    icon: Dumbbell,
    title: 'Exercise Programs',
    description:
      'Safe, structured movement for ages 50+ — from gentle mobility routines to progressive strength training designed to rebuild function, not just fitness.',
  },
  {
    icon: Plane,
    title: 'Travel',
    description:
      'We help you prepare physically and mentally for travel — so age doesn\'t stop you from seeing the places and people you love.',
  },
  {
    icon: Users,
    title: 'Social Activities',
    description:
      'Group events, community walks, and peer gatherings that keep you connected, motivated, and surrounded by people who understand the journey.',
  },
  {
    icon: Footprints,
    title: 'Going Out Alone',
    description:
      'Rebuilding the confidence to step outside independently — to the market, the temple, the park — is one of our most meaningful outcomes.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'After the fall-prevention workshop, I finally feel confident walking to the market on my own again.',
    name: 'Lakshmi',
    detail: 'Age 64, Hyderabad',
  },
  {
    quote:
      'The nutrition guidance helped me manage my sugar levels without giving up the foods I love.',
    name: 'Ramesh',
    detail: 'Age 58, Hyderabad',
  },
  {
    quote:
      'I joined just to listen in, but the community kept me coming back every single week.',
    name: 'Padma',
    detail: 'Age 71, Secunderabad',
  },
];

const WORKSHOPS = [
  {
    title: 'Fall Prevention & Balance Workshop',
    date: 'Date to be announced',
    description: 'Simple daily exercises to improve balance and reduce fall risk at home.',
  },
  {
    title: 'Nutrition After 50: Eating for Strength',
    date: 'Date to be announced',
    description: 'Build a plate that supports muscle, bones, and energy — the Indian way.',
  },
  {
    title: '10-Day Stair Challenge Kickoff',
    date: 'Date to be announced',
    description: 'A friendly community challenge to rebuild stair confidence, one flight at a time.',
  },
];

const FAQS = [
  {
    q: 'Does my surrounding environment impact my strength?',
    a: 'Absolutely. An uncomfortable or unsafe environment — one with uneven floors, poor lighting, or no space to move — can significantly limit your ability to stay active and build strength. Stronger Steps teaches you how to work with your environment, not against it.',
  },
  {
    q: 'Do I need guidance for strength training?',
    a: 'With guidance, you get a structured, safe plan with reduced injury risk, faster progress, and expert support. Without guidance, you may still see some benefit, but the risk of incorrect technique and slower results is real. For adults 50+, proper guidance makes all the difference — which is exactly why our programs are doctor-designed.',
  },
  {
    q: 'I am scared of gym weights and their hazardous injuries. Should I be?',
    a: 'This is not a traditional gym. Stronger Steps is built specifically for adults over 50, with exercises that prioritise safety, joint health, and gradual progression. We use low-risk resistance tools — no heavy barbells or intimidating equipment — and every exercise is supervised or clearly explained.',
  },
  {
    q: 'Is it safe to register for the programme?',
    a: 'Absolutely. Our programme is designed with safety as the top priority. Every exercise and activity is appropriate for older adults and has been vetted by our founding doctors. If you have specific health conditions, we take those into account.',
  },
  {
    q: 'Are the staff trained enough?',
    a: 'Yes. Our team holds qualifications including a Diploma in Geriatric Medicine, Diploma in Palliative Rehabilitation, MCh CTVS, MS ENT, and published papers in the International Journal of Geriatrics. You are in experienced, specialist hands.',
  },
  {
    q: 'Is it a regular gym that allows all age groups?',
    a: 'No. This is not a traditional gym. Stronger Steps is exclusively for adults 50 and above. Here, you will find people in your own age group — facing the same challenges, sharing the same goals. It\'s a community, not a gym floor.',
  },
  {
    q: 'Is it based on scientific evidence?',
    a: 'Yes. Stronger Steps was founded by doctors with specialist training in geriatric medicine and rehabilitation. Every programme, tool, and recommendation is grounded in clinical evidence and real-world experience with the 50+ population.',
  },
  {
    q: 'Do you train for muscle building and weight loss?',
    a: 'It is completely personalised. We assess your current health, goals, and fitness level and design a plan around you — whether that involves building functional muscle, managing weight, improving balance, or all three.',
  },
  {
    q: 'What is the cost of subscription?',
    a: '₹3,500/- rupees only. This gives you access to our structured programme, doctor-reviewed resources, and community support — one of the most affordable specialist wellness investments you can make for your health after 50.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-bg">
        <div className="mx-auto grid max-w-content items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Eyebrow>strongersteps.in</Eyebrow>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-primary-dark md:text-5xl">
              Helping Adults 50+ Stay Strong, Independent, and Confident.
            </h1>
            <p className="mt-5 text-lg text-muted md:text-xl">
              Exercise. Education. Community.
              <br />
              <span className="font-semibold text-primary-dark">Small Steps. Stronger Years.</span>
            </p>
            <p className="mt-3 text-sm text-muted italic">
              Doctor-founded · Built for India · Built for You
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/join" variant="primary">
                Join Our Community
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button href="/knowledge-center" variant="outline">
                Explore Knowledge Center
              </Button>
            </div>
          </div>
          <HeroSteps />
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#1B3E30" />

      {/* Why It Matters */}
      <section className="bg-primary-dark text-white">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <SectionHeading
            eyebrow="Why it matters"
            title="The years after 50 bring real, but manageable, challenges"
            description="These are the five things we hear most — every one of them is a warning sign you can act on early."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_IT_MATTERS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl2 bg-white/10 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary-dark">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-white/75">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#1B3E30" to="#FBF7EF" flip />

      {/* Our Vision */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <SectionHeading
            eyebrow="Our vision"
            title="What stronger years actually look like"
            description="These are the four outcomes we build every programme, tool, and community event around."
            align="center"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {OUR_VISION.map(({ icon: Icon, title, description }, i) => (
              <div key={title} className="rounded-xl2 bg-sage p-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-primary-dark">{title}</h3>
                <p className="mt-2 text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* What We Do */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <SectionHeading
            eyebrow="What we do"
            title="Four ways we support your stronger years"
            align="center"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_WE_DO.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl2 bg-white p-6 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light/20 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-primary-dark">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Real Stories */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <SectionHeading
            eyebrow="Real stories"
            title="From people taking stronger steps"
            description="A few notes from our early community. (Sample stories shown here — swap in real member photos and feedback as they come in.)"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, detail }) => (
              <figure key={name} className="rounded-xl2 border border-line bg-white p-6">
                <Quote size={24} className="text-accent" aria-hidden="true" />
                <blockquote className="mt-4 text-base text-ink/90">&ldquo;{quote}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage font-display font-semibold text-primary-dark">
                    {name.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-display text-sm font-semibold text-primary-dark">
                      {name}
                    </span>
                    <span className="block text-xs text-muted">{detail}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />



      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* FAQ */}
      <section id="faq" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <SectionHeading eyebrow="FAQ" title="Common questions" />
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group rounded-xl2 bg-white p-5 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-primary-dark">
                  {q}
                  <ChevronDown size={20} className="faq-chevron shrink-0 text-primary" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-sm text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#1B3E30" />

      {/* Final CTA */}
      <section className="bg-primary-dark text-white">
        <div className="mx-auto max-w-content px-6 py-16 text-center md:py-24">
          <Star size={32} className="mx-auto text-accent" aria-hidden="true" />
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Ready to take stronger steps?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">
            Join our free community for weekly tips and updates, or reserve your seat at the
            next workshop.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/join" variant="accent">
              <Users size={18} aria-hidden="true" />
              Join Community
            </Button>
            <Button href="/programs" variant="outlineLight">
              <Calendar size={18} aria-hidden="true" />
              Book a Workshop
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
