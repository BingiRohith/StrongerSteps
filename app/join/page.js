import { MessageCircle, Calendar, Crown, Handshake, Check, ArrowRight } from 'lucide-react';
import { Button, Badge, Eyebrow, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';

const COMMUNITY_PERKS = [
  'Weekly health tips tailored to adults 50+',
  'First access to new workshops and programs',
  'Peer support from community members across Hyderabad',
  'Monthly Q&A sessions with our founding doctors',
  'Exclusive infographics and free tools',
];

const PARTNER_TYPES = [
  {
    icon: Handshake,
    title: 'Physiotherapists & Healthcare Professionals',
    description: 'Collaborate on workshops, contribute to content, or refer patients to our programs. Help us reach more people who need what you know.',
  },
  {
    icon: Crown,
    title: 'Corporate Wellness Partners',
    description: 'Bring Stronger Steps into your workplace wellness program for employees 50+ or those with aging parents.',
  },
  {
    icon: Calendar,
    title: 'Community Organisations',
    description: 'Work with us to bring workshops to retirement communities, temples, and neighbourhood groups across Hyderabad.',
  },
];

export default function JoinPage() {
  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Join Us</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            You don\'t take stronger steps alone
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Whether you\'re starting your own journey or supporting someone you love, there\'s a place for you in the Stronger Steps community.
          </p>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Free Community */}
      <section id="community" className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <Badge tone="sage">Free to join</Badge>
              <h2 className="mt-4 font-display text-3xl font-bold text-primary-dark md:text-4xl">
                Join our WhatsApp Community
              </h2>
              <p className="mt-4 text-lg text-muted">
                Our free community is where adults 50+ and their families exchange support, tips, and encouragement every day.
              </p>
              <ul className="mt-6 space-y-3">
                {COMMUNITY_PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-3">
                    <Check size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-ink">{perk}</span>
                  </li>
                ))}
              </ul>
              <Button href="https://wa.me/919999999999" variant="primary" className="mt-8">
                <MessageCircle size={18} aria-hidden="true" /> Join on WhatsApp
              </Button>
            </div>
            <div className="rounded-xl2 bg-primary-dark p-8 text-white">
              <MessageCircle size={32} className="text-accent" aria-hidden="true" />
              <h3 className="mt-4 font-display text-2xl font-bold">Free community</h3>
              <p className="mt-2 text-white/75">Weekly tips, workshop updates, peer support and monthly doctor Q&As — all free on WhatsApp.</p>
              <p className="mt-6 font-display text-4xl font-bold text-accent">₹0 <span className="text-lg font-normal text-white/60">/ forever</span></p>
              <Button href="https://wa.me/919999999999" variant="accent" className="mt-6 w-full">
                Join Now <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Workshops */}
      <section id="workshops" className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Workshops" title="Reserve your seat" description="In-person sessions in Hyderabad led by our founding doctors. Register your interest and we\'ll contact you when dates are confirmed." />
          <div className="rounded-xl2 border border-line bg-white p-8">
            <p className="text-muted">Fill in your details and we\'ll reach out as soon as workshop dates are announced.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-display text-sm font-semibold text-primary-dark" htmlFor="ws-name">Full name</label>
                <input id="ws-name" type="text" placeholder="Your name" className="mt-1 w-full rounded-lg border border-line px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block font-display text-sm font-semibold text-primary-dark" htmlFor="ws-phone">WhatsApp number</label>
                <input id="ws-phone" type="tel" placeholder="+91 ..." className="mt-1 w-full rounded-lg border border-line px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-display text-sm font-semibold text-primary-dark" htmlFor="ws-interest">Which workshop interests you?</label>
                <select id="ws-interest" className="mt-1 w-full rounded-lg border border-line px-4 py-2.5 text-sm text-muted focus:border-primary focus:outline-none">
                  <option>Fall Prevention & Balance</option>
                  <option>Nutrition After 50</option>
                  <option>10-Day Stair Challenge Kickoff</option>
                  <option>Any / All workshops</option>
                </select>
              </div>
            </div>
            <Button variant="primary" className="mt-6">Register Interest <ArrowRight size={18} /></Button>
          </div>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Membership (Coming Soon) */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Membership" title="Premium membership — coming soon" description="A paid tier with structured programs, 1-on-1 access to our doctors, and early access to every new tool and course we release." />
          <div className="rounded-xl2 border border-dashed border-primary/40 bg-white p-8 text-center">
            <Crown size={36} className="mx-auto text-accent" aria-hidden="true" />
            <h3 className="mt-4 font-display text-xl font-bold text-primary-dark">Stronger Steps Premium</h3>
            <p className="mt-2 text-muted">We\'re working on it. Join the free community now and you\'ll be the first to know — and the first to get a founding member discount.</p>
            <Button href="https://wa.me/919999999999" variant="primary" className="mt-6">
              <MessageCircle size={18} /> Join community to get notified
            </Button>
          </div>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Partner */}
      <section id="partner" className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Partnerships" title="Work with us" description="We partner with healthcare professionals and organisations who share our mission of making healthy aging accessible." />
          <div className="grid gap-6 md:grid-cols-3">
            {PARTNER_TYPES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl2 border border-line bg-white p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-primary-dark">{title}</h3>
                <p className="mt-2 text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button href="mailto:hello@strongersteps.in" variant="outline">
              Get in touch to partner
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
