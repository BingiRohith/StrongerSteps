import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft, ListChecks, Sigma } from 'lucide-react';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolCategory from '@/models/ToolCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import ToolForm from '@/components/admin/tools/ToolForm';

export const dynamic = 'force-dynamic';

export default async function EditToolPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const tool = await Tool.findById(params.id).populate('category', 'name slug').lean();
  if (!tool) notFound();

  const initialData = JSON.parse(JSON.stringify(tool));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/tools"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft size={16} />
          Back to tools
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/tools/${params.id}/builder`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-primary-dark hover:border-primary"
          >
            <ListChecks size={14} />
            Sections & questions
          </Link>
          <Link
            href={`/admin/tools/${params.id}/scoring`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-primary-dark hover:border-primary"
          >
            <Sigma size={14} />
            Scoring & recommendations
          </Link>
        </div>
      </div>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit tool</h2>
      <ToolForm toolId={params.id} initialData={initialData} />
    </div>
  );
}
