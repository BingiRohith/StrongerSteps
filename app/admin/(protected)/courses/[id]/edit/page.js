import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft, Layers } from 'lucide-react';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import CourseCategory from '@/models/CourseCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import CourseForm from '@/components/admin/courses/CourseForm';

export const dynamic = 'force-dynamic';

export default async function EditCoursePage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const course = await Course.findById(params.id).populate('category', 'name slug').lean();
  if (!course) notFound();

  const initialData = JSON.parse(JSON.stringify(course));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft size={16} />
          Back to courses
        </Link>
        <Link
          href={`/admin/courses/${params.id}/curriculum`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-primary-dark hover:border-primary"
        >
          <Layers size={14} />
          Manage curriculum
        </Link>
      </div>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit course</h2>
      <CourseForm courseId={params.id} initialData={initialData} />
    </div>
  );
}
