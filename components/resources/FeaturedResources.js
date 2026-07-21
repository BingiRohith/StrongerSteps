import { SectionHeading } from '@/components/ui';
import ResourceCard from './ResourceCard';

/** Mirrors components/courses/FeaturedCourses.js. Renders nothing if there are no featured resources yet. */
export default function FeaturedResources({ resources }) {
  if (!resources?.length) return null;

  return (
    <section className="bg-sage">
      <div className="mx-auto max-w-content px-6 py-16 md:py-20">
        <SectionHeading
          eyebrow="Featured"
          title="Popular resources"
          description="Clinically validated guides, checklists, and downloads curated by our team."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard key={resource._id} resource={resource} />
          ))}
        </div>
      </div>
    </section>
  );
}
