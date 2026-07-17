import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import CourseCategoryForm from '@/components/admin/course-categories/CourseCategoryForm';

export default function NewCourseCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/course-categories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to course categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New course category</h2>
      <CourseCategoryForm />
    </div>
  );
}
