import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft, Pencil, Sigma } from 'lucide-react';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolBuilder from '@/components/admin/tools/ToolBuilder';

export const dynamic = 'force-dynamic';

export default async function ToolBuilderPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const tool = await Tool.findById(params.id).select('title').lean();
  if (!tool) notFound();

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
            href={`/admin/tools/${params.id}/scoring`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-primary-dark hover:border-primary"
          >
            <Sigma size={14} />
            Scoring & recommendations
          </Link>
          <Link
            href={`/admin/tools/${params.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-primary-dark hover:border-primary"
          >
            <Pencil size={14} />
            Edit tool details
          </Link>
        </div>
      </div>
      <h2 className="mb-1 font-display text-xl font-bold text-primary-dark">Sections & questions</h2>
      <p className="mb-6 text-sm text-muted">{tool.title}</p>
      <ToolBuilder toolId={params.id} />
    </div>
  );
}
