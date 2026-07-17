import { SectionHeading } from '@/components/ui';
import CourseCard from './CourseCard';

/** Mirrors components/recipes/FeaturedRecipes.js. Renders nothing if there are no featured courses yet. */
export default function FeaturedCourses({ courses }) {
  if (!courses?.length) return null;

  return (
    <section className="bg-sage">
      <div className="mx-auto max-w-content px-6 py-16 md:py-20">
        <SectionHeading
          eyebrow="Featured"
          title="Popular courses"
          description="Structured, self-paced learning designed with our founding doctors."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
