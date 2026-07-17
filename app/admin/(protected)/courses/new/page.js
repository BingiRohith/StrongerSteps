import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import CourseForm from '@/components/admin/courses/CourseForm';

export default function NewCoursePage() {
  return (
    <div>
      <Link
        href="/admin/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to courses
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New course</h2>
      <CourseForm />
    </div>
  );
}
