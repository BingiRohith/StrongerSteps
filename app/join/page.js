import { Check, Crown, MessageCircle, ArrowRight, HeartHandshake, CalendarCheck, Percent, Users } from 'lucide-react';
import { Button, Badge, Eyebrow, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';

// Placeholder membership catalog. Field names deliberately mirror the future
// Membership CMS (CRS §8: name, description, price, discount, duration,
// benefits, image, displayOrder, status, featured, ctaLabel, externalUrl) so
// this array can be swapped for a DB fetch later without touching the
// layout below — the same pattern Products/Team followed before their CMS
// existed. `externalUrl` is a placeholder WhatsApp contact until a real
// payment/membership platform link is configured.
const MEMBERSHIP_PLANS = [
  {
    displayOrder: 1,
    status: 'published',
    featured: false,
    name: 'Community',
    description: 'Stay connected and get started with free access to our community and basic resources.',
    price: 0,
    discount: 0,
    duration: 'Free forever',
    benefits: [
      'Weekly health tips for adults 50+',
      'Access to the community WhatsApp group',
      'Free monthly newsletter',
      'Invitations to select public events',
    ],
    ctaLabel: 'Join for Free',
    externalUrl: 'https://wa.me/919999999999',
  },
  {
    displayOrder: 2,
    status: 'published',
    featured: true,
    name: 'Stronger Steps Plus',
    description: 'Structured support for members who want more than the free community — priority access and real savings.',
    price: 1499,
    discount: 10,
    duration: 'Per month',
    benefits: [
      'Everything in Community',
      'Discounted pricing on workshops & events',
      'Priority booking for limited-seat sessions',
      'Quarterly 1-on-1 check-in call',
      'Access to exclusive member-only content',
    ],
    ctaLabel: 'Become a Member',
    externalUrl: 'https://wa.me/919999999999',
  },
  {
    displayOrder: 3,
    status: 'published',
    featured: false,
    name: 'Stronger Steps Family',
    description: 'For families supporting a loved one’s healthy ageing journey together, at a lower annual rate.',
    price: 14999,
    discount: 15,
    duration: 'Per year',
    benefits: [
      'Everything in Stronger Steps Plus',
      'Covers up to 2 family members',
      'Shared family progress updates',
      'Founding member pricing locked in for renewal',
    ],
    ctaLabel: 'Enquire Now',
    externalUrl: 'https://wa.me/919999999999',
  },
];

const MEMBER_BENEFITS = [
  {
    icon: Percent,
    title: 'Real Savings',
    description: 'Member discounts on workshops, events, and select products — configured and updated by our team.',
  },
  {
    icon: CalendarCheck,
    title: 'Priority Access',
    description: 'First access and priority booking whenever seats or slots are limited.',
  },
  {
    icon: HeartHandshake,
    title: '1-on-1 Support',
    description: 'Regular check-ins with our team to keep your goals on track.',
  },
  {
    icon: Users,
    title: 'A Community That Understands',
    description: 'Peer support from people in your own age group, facing the same journey.',
  },
];

function formatPrice(price) {
  if (!price) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function JoinPage() {
  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Membership</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Take your first step with Stronger Steps membership
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Whether you&apos;re starting your own journey or supporting someone you love, choose the
            membership that fits — from a free community plan to structured, doctor-designed support.
          </p>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Membership Plans */}
      <section id="plans" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="Membership plans"
            title="Choose your plan"
            description="Realistic starting prices — our team can adjust pricing, discounts, and benefits for your household at any time."
            align="center"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {MEMBERSHIP_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-xl2 border bg-white p-8 ${
                  plan.featured ? 'border-2 border-accent shadow-lg' : 'border-line'
                }`}
              >
                {plan.featured && (
                  <Badge tone="accent" className="mb-4 w-fit">
                    <Crown size={12} className="mr-1 -ml-0.5" aria-hidden="true" />
                    Most Popular
                  </Badge>
                )}
                <h3 className="font-display text-xl font-bold text-primary-dark">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-primary-dark">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted">/ {plan.duration.toLowerCase()}</span>
                  )}
                </div>
                {plan.discount > 0 && (
                  <Badge tone="sage" className="mt-2 w-fit">{plan.discount}% member discount applied</Badge>
                )}

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <Check size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="text-sm text-ink">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  href={plan.externalUrl}
                  variant={plan.featured ? 'accent' : 'primary'}
                  className="mt-8 w-full"
                >
                  {plan.ctaLabel} <ArrowRight size={18} aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Why Join */}
      <section id="benefits" className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Why join" title="What membership includes" align="center" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MEMBER_BENEFITS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl2 border border-line bg-white p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-primary-dark">{title}</h3>
                <p className="mt-2 text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#1B3E30" />

      {/* Final CTA */}
      <section className="bg-primary-dark text-white">
        <div className="mx-auto max-w-content px-6 py-16 text-center md:py-20">
          <Crown size={32} className="mx-auto text-accent" aria-hidden="true" />
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Ready to take your first step?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">
            Start free, or go further with a membership built around your goals.
          </p>
          <Button href="https://wa.me/919999999999" variant="accent" className="mt-8">
            <MessageCircle size={18} aria-hidden="true" /> Talk to Us on WhatsApp
          </Button>
        </div>
      </section>
    </>
  );
}
