import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft, Pencil } from 'lucide-react';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import CurriculumManager from '@/components/admin/courses/CurriculumManager';

export const dynamic = 'force-dynamic';

export default async function CourseCurriculumPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const course = await Course.findById(params.id).select('title').lean();
  if (!course) notFound();

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
          href={`/admin/courses/${params.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-primary-dark hover:border-primary"
        >
          <Pencil size={14} />
          Edit course details
        </Link>
      </div>
      <h2 className="mb-1 font-display text-xl font-bold text-primary-dark">Curriculum</h2>
      <p className="mb-6 text-sm text-muted">{course.title}</p>
      <CurriculumManager courseId={params.id} />
    </div>
  );
}
