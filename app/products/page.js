import { ShoppingBag, BookMarked, Shirt, ArrowRight, Package } from 'lucide-react';
import { Button, Eyebrow, SectionHeading } from '@/components/ui';
import ComingSoonCard from '@/components/ComingSoonCard';
import StepDivider from '@/components/StepDivider';

const MOBILITY_AIDS = [
  {
    title: 'High-Contrast Neon Tape',
    description: 'Highly visible safety tape for marking step edges, doorways, and hazard zones — helps older adults with low vision navigate safely at home.',
  },
  {
    title: 'Water-Filled Plastic Bottles',
    description: 'Adjustable-weight resistance tools — the simplest, most accessible home exercise equipment there is. No gym required.',
  },
  {
    title: 'Spring-Loaded Grip Squeezer',
    description: 'A handheld grip strengthener for building hand and forearm strength — important for carrying, opening jars, and preventing falls when grabbing railings.',
  },
  {
    title: 'Anti-Fatigue Foam Kitchen Mat',
    description: 'A cushioned mat for the kitchen floor to reduce joint pain and fatigue during standing tasks — one of the most impactful comfort purchases for daily life.',
  },
  {
    title: 'Wheeled Utility Rolling Cart',
    description: 'A practical rolling cart to carry items safely between rooms — reduces strain, avoids awkward lifting, and helps maintain independence at home.',
  },
];

const EDUCATIONAL_PRODUCTS = [
  {
    title: 'Printed Daily Protein Tracking Card',
    description: 'A simple, laminated daily card to track protein intake at each meal — designed for adults 50+ who need to protect and rebuild muscle mass. Doctor-designed, easy to use.',
  },
];

export default function ProductsPage() {
  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Products</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Tools and products that support your stronger years
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Curated mobility aids, educational products, and branded merchandise — all selected by our doctors with the 50+ community in mind. Coming soon.
          </p>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Mobility Aids */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Mobility Aids" title="Practical aids for everyday independence" description="Five products selected by our doctors to help you stay safe, capable, and mobile at home." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MOBILITY_AIDS.map(({ title, description }) => (
              <ComingSoonCard key={title} icon={Package} title={title} description={description} />
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Educational Products */}
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Educational Products" title="Learning tools you can hold in your hands" description="Printed guides and tracking tools developed with our founding doctors." />
          <div className="grid gap-6 sm:grid-cols-2 md:max-w-2xl">
            {EDUCATIONAL_PRODUCTS.map(({ title, description }) => (
              <ComingSoonCard key={title} icon={BookMarked} title={title} description={description} />
            ))}
          </div>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Merchandise */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Merchandise" title="Wear the movement" description="Comfortable, purposeful branded gear for community members who want to show they\'re taking stronger steps." />
          <div className="grid gap-6 sm:grid-cols-3">
            <ComingSoonCard icon={Shirt} title="Stronger Steps T-Shirts" description="Soft, breathable tees in sizes designed for a comfortable fit for older adults." />
            <ComingSoonCard icon={Shirt} title="Walking Gear Bundle" description="Cap, water bottle, and wristband — everything you need for a confident morning walk." />
            <ComingSoonCard icon={Shirt} title="Community Gift Sets" description="Ready-to-gift sets for family members who want to encourage a loved one's healthy aging journey." />
          </div>

          <div className="mt-12 rounded-xl2 bg-primary-dark p-8 text-white">
            <h3 className="font-display text-xl font-bold">Be the first to know when products launch</h3>
            <p className="mt-2 text-white/75">Join our community and we\'ll notify you as soon as the shop goes live.</p>
            <Button href="/join" variant="accent" className="mt-5">
              Join the Community <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
