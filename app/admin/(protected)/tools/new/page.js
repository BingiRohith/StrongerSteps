import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ToolForm from '@/components/admin/tools/ToolForm';

export default function NewToolPage() {
  return (
    <div>
      <Link
        href="/admin/tools"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to tools
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New tool</h2>
      <ToolForm />
    </div>
  );
}
