import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import BlogForm from '@/components/admin/blogs/BlogForm';

export default function NewBlogPage() {
  return (
    <div>
      <Link
        href="/admin/blogs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to blogs
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New blog</h2>
      <BlogForm />
    </div>
  );
}
