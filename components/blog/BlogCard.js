import Link from 'next/link';
import { Clock, Calendar, BookOpen, Star } from 'lucide-react';
import { Badge } from '@/components/ui';

export function formatBlogDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BlogCard({ blog }) {
  if (!blog) return null;

  return (
    <Link
      href={`/knowledge-center/blogs/${blog.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white transition-colors hover:border-primary"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-sage">
        {blog.coverImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
          <img
            src={blog.coverImage.url}
            alt={blog.coverImage.alt || blog.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            <BookOpen size={32} aria-hidden="true" />
          </div>
        )}
        {blog.category?.name && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">{blog.category.name}</Badge>
          </span>
        )}
        {blog.featured && (
          <span className="absolute right-3 top-3">
            <Badge tone="primary">
              <Star size={11} className="mr-1 -ml-0.5 fill-current" aria-hidden="true" />
              Featured
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug text-primary-dark line-clamp-2 group-hover:text-primary">
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="mt-2 flex-1 text-sm text-muted line-clamp-3">{blog.excerpt}</p>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} aria-hidden="true" />
            {blog.readingTime} min read
          </span>
          {blog.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} aria-hidden="true" />
              {formatBlogDate(blog.publishedAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
