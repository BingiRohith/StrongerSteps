import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import Category from '@/models/Category'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import BlogForm from '@/components/admin/blogs/BlogForm';

export const dynamic = 'force-dynamic';

export default async function EditBlogPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const blog = await Blog.findById(params.id).populate('category', 'name slug').lean();
  if (!blog) notFound();

  // Strip to JSON-serializable plain data for the client component.
  const initialData = JSON.parse(JSON.stringify(blog));

  return (
    <div>
      <Link
        href="/admin/blogs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to blogs
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit blog</h2>
      <BlogForm blogId={params.id} initialData={initialData} />
    </div>
  );
}
