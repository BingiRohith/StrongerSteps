import { SectionHeading } from '@/components/ui';
import ToolCard from './ToolCard';

/** Mirrors components/resources/FeaturedResources.js. Renders nothing if there are no featured tools yet. */
export default function FeaturedTools({ tools }) {
  if (!tools?.length) return null;

  return (
    <section className="bg-sage">
      <div className="mx-auto max-w-content px-6 py-16 md:py-20">
        <SectionHeading
          eyebrow="Featured"
          title="Popular tools"
          description="Quick, doctor-informed assessments and calculators curated by our team."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool._id} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
