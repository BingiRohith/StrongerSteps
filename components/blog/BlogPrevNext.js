import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

function NavCard({ blog, direction }) {
  if (!blog) return <div className="hidden sm:block" aria-hidden="true" />;

  const isPrev = direction === 'prev';

  return (
    <Link
      href={`/knowledge-center/blogs/${blog.slug}`}
      className={`group flex items-center gap-4 rounded-xl2 border border-line bg-white p-5 transition-colors hover:border-primary ${
        isPrev ? '' : 'sm:text-right sm:flex-row-reverse'
      }`}
    >
      <div className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sage sm:block">
        {blog.coverImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file
          <img src={blog.coverImage.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            <BookOpen size={20} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent-dark ${
            isPrev ? '' : 'sm:flex-row-reverse'
          }`}
        >
          {isPrev ? <ArrowLeft size={13} aria-hidden="true" /> : <ArrowRight size={13} aria-hidden="true" />}
          {isPrev ? 'Previous' : 'Next'}
        </span>
        <p className="mt-1 line-clamp-2 font-display text-sm font-semibold text-primary-dark group-hover:text-primary">
          {blog.title}
        </p>
      </div>
    </Link>
  );
}

export default function BlogPrevNext({ prev, next }) {
  if (!prev && !next) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <NavCard blog={prev} direction="prev" />
      <NavCard blog={next} direction="next" />
    </div>
  );
}
