'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RecipesPagination({ pagination, onPageChange }) {
  const { page, pages } = pagination;
  if (pages <= 1) return null;

  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Recipes pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pageNumbers.map((n, i) => {
        const prev = pageNumbers[i - 1];
        const showEllipsis = prev && n - prev > 1;
        return (
          <span key={n} className="flex items-center gap-1.5">
            {showEllipsis && <span className="px-1 text-muted">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                n === page ? 'bg-primary text-white' : 'text-ink/70 hover:bg-sage'
              }`}
            >
              {n}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
