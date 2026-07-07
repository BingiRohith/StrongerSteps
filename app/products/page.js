import { BookMarked, Shirt, Package, ArrowRight } from 'lucide-react';
import { Button, Eyebrow, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import ProductCard from '@/components/products/ProductCard';
import { getPublishedProducts } from '@/lib/publicProducts';

export const dynamic = 'force-dynamic';

const CATEGORY_ICONS = {
  'mobility-aids': Package,
  'educational-products': BookMarked,
  merchandise: Shirt,
};

export default async function ProductsPage() {
  const products = await getPublishedProducts();
  const mobilityAids = products.filter((p) => p.category === 'mobility-aids');
  const educationalProducts = products.filter((p) => p.category === 'educational-products');
  const merchandise = products.filter((p) => p.category === 'merchandise');

  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Products</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Tools and products that support your stronger years
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Curated mobility aids, educational products, and branded merchandise — all selected by our doctors with the 50+ community in mind.
          </p>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Mobility Aids */}
      {mobilityAids.length > 0 && (
        <section className="bg-sage">
          <div className="mx-auto max-w-content px-6 py-16 md:py-20">
            <SectionHeading eyebrow="Mobility Aids" title="Practical aids for everyday independence" description="Products selected by our doctors to help you stay safe, capable, and mobile at home." />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mobilityAids.map((product) => (
                <ProductCard key={product._id} product={product} icon={CATEGORY_ICONS['mobility-aids']} />
              ))}
            </div>
          </div>
        </section>
      )}

      <StepDivider from="#E6EEE4" to="#FBF7EF" flip />

      {/* Educational Products */}
      {educationalProducts.length > 0 && (
        <section className="bg-bg">
          <div className="mx-auto max-w-content px-6 py-16 md:py-20">
            <SectionHeading eyebrow="Educational Products" title="Learning tools you can hold in your hands" description="Printed guides and tracking tools developed with our founding doctors." />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {educationalProducts.map((product) => (
                <ProductCard key={product._id} product={product} icon={CATEGORY_ICONS['educational-products']} />
              ))}
            </div>
          </div>
        </section>
      )}

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      {/* Merchandise */}
      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Merchandise" title="Wear the movement" description="Comfortable, purposeful branded gear for community members who want to show they're taking stronger steps." />
          {merchandise.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {merchandise.map((product) => (
                <ProductCard key={product._id} product={product} icon={CATEGORY_ICONS.merchandise} />
              ))}
            </div>
          )}

          <div className="mt-12 rounded-xl2 bg-primary-dark p-8 text-white">
            <h3 className="font-display text-xl font-bold">Be the first to know when checkout goes live</h3>
            <p className="mt-2 text-white/75">Join our community and we'll notify you as soon as you can buy directly on the site.</p>
            <Button href="/join" variant="accent" className="mt-5">
              Join the Community <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
