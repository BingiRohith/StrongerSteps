import {
  ArrowRight,
  Star,
  ChevronDown,
  Quote,
} from 'lucide-react';
import { Button, Eyebrow, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import HeroSteps from '@/components/HeroSteps';
import WhyItMattersHand from '@/components/WhyItMattersHand';
import VisionHouse from '@/components/VisionHouse';
import { FadeIn, Reveal, HoverLift, HoverScale } from '@/components/motion';
import { getPublicHomepage } from '@/lib/publicHomepage';
import { getIcon } from '@/lib/homepageIcons';

export const dynamic = 'force-dynamic';

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

export default async function HomePage() {
  const homepage = await getPublicHomepage();
  const { hero, whyItMatters, vision, whatWeDo, membershipCta } = homepage;

  const whyItMattersItems = whyItMatters.points.map((p) => ({ ...p, icon: getIcon(p.icon) }));
  const visionItems = vision.pillars.map((p) => ({ ...p, icon: getIcon(p.icon) }));

  return (
    <>
      {/* Hero */}
      <section
        className={hero.backgroundImage?.url ? 'bg-cover bg-center' : 'bg-bg'}
        style={hero.backgroundImage?.url ? { backgroundImage: `url(${hero.backgroundImage.url})` } : undefined}
      >
        <div className="mx-auto grid max-w-content items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <FadeIn>
            <Eyebrow>strongersteps.in</Eyebrow>
            <h1 className="mt-3 whitespace-pre-line font-display text-4xl font-bold leading-tight text-primary-dark md:text-5xl">
              {hero.heading}
            </h1>
            {hero.subHeading && (
              <p className="mt-5 text-lg text-muted md:text-xl">
                {hero.subHeading}
                {hero.description && (
                  <>
                    <br />
                    <span className="font-semibold text-primary-dark">{hero.description}</span>
                  </>
                )}
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {hero.primaryButtonText && (
                <Button href={hero.primaryButtonUrl || '/'} variant="primary">
                  {hero.primaryButtonText}
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
              )}
              {hero.secondaryButtonText && (
                <Button href={hero.secondaryButtonUrl || '/'} variant="outline">
                  {hero.secondaryButtonText}
                </Button>
              )}
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <HoverScale scale={1.03} className="mx-auto w-full max-w-md">
              {hero.illustrationImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded illustration, not an optimizable local asset
                <img
                  src={hero.illustrationImage.url}
                  alt={hero.illustrationImage.alt || ''}
                  className="w-full rounded-xl2"
                />
              ) : (
                <HeroSteps />
              )}
            </HoverScale>
          </FadeIn>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#1B3E30" />

      {/* Why It Matters */}
      <section className="bg-primary-dark text-white">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <Reveal>
            <SectionHeading
              eyebrow={whyItMatters.eyebrow}
              title={whyItMatters.title}
              description={whyItMatters.description}
            />
            {whyItMattersItems.length > 0 ? (
              <WhyItMattersHand items={whyItMattersItems} />
            ) : (
              <p className="text-white/75">Content coming soon.</p>
            )}
          </Reveal>
        </div>
      </section>

      <StepDivider from="#1B3E30" to="#FBF7EF" flip />

      {/* Our Vision */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <Reveal>
            <SectionHeading
              eyebrow={vision.eyebrow}
              title={vision.title}
              description={vision.description}
              align="center"
            />
            {visionItems.length > 0 ? (
              <VisionHouse items={visionItems} />
            ) : (
              <p className="text-center text-muted">Content coming soon.</p>
            )}
          </Reveal>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* What We Do */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <Reveal>
            <SectionHeading eyebrow={whatWeDo.eyebrow} title={whatWeDo.title} description={whatWeDo.description} align="center" />
            {whatWeDo.cards.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {whatWeDo.cards.map((card, i) => (
                  <HoverLift key={i} className="flex flex-col overflow-hidden rounded-xl2 bg-white shadow-sm">
                    <div className="aspect-[4/3] w-full overflow-hidden bg-sage">
                      <HoverScale scale={1.03} className="h-full w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded/placeholder photo, not an optimizable local asset */}
                        <img src={card.image?.url} alt={card.image?.alt || ''} className="h-full w-full object-cover" />
                      </HoverScale>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-base font-semibold text-primary-dark">{card.title}</h3>
                      <p className="mt-2 text-sm text-muted">{card.description}</p>
                      {card.ctaLabel && (
                        <a href={card.ctaUrl || '#'} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                          {card.ctaLabel}
                          <ArrowRight size={14} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </HoverLift>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted">Content coming soon.</p>
            )}
          </Reveal>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Real Stories */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Real stories"
              title="From people taking stronger steps"
              description="A few notes from our early community. (Sample stories shown here — swap in real member photos and feedback as they come in.)"
            />
            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map(({ quote, name, detail }) => (
                <HoverLift key={name} as="figure" lift={4} className="rounded-xl2 border border-line bg-white p-6">
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
                </HoverLift>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {membershipCta.active && (
        <>
          <StepDivider from="#FBF7EF" to="#1B3E30" />
          <section
            className={`text-white ${membershipCta.backgroundImage?.url ? 'bg-cover bg-center' : 'bg-primary-dark'}`}
            style={
              membershipCta.backgroundImage?.url
                ? { backgroundImage: `url(${membershipCta.backgroundImage.url})` }
                : undefined
            }
          >
            <div className="mx-auto max-w-content px-6 py-16 text-center md:py-24">
              <Reveal>
                <Star size={32} className="mx-auto text-accent" aria-hidden="true" />
                <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">{membershipCta.heading}</h2>
                {membershipCta.description && (
                  <p className="mx-auto mt-3 max-w-xl text-white/75">{membershipCta.description}</p>
                )}
                {membershipCta.buttonText && (
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button href={membershipCta.buttonUrl || '/join'} variant="accent">
                      {membershipCta.buttonText}
                    </Button>
                  </div>
                )}
              </Reveal>
            </div>
          </section>
          <StepDivider from="#1B3E30" to="#E6EEE4" flip />
        </>
      )}

      {!membershipCta.active && <StepDivider from="#FBF7EF" to="#E6EEE4" />}

      {/* FAQ */}
      <section id="faq" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-24">
          <Reveal>
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
          </Reveal>
        </div>
      </section>
    </>
  );
}
