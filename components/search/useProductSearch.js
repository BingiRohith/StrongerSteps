'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Debounced (350ms, matching the existing Infographics-grid debounce
 * pattern) product search against the public `/api/products` route —
 * the same server-side search used by the Products page toolbar, so the
 * header and the Products page never diverge. `limit` keeps the header's
 * dropdown small; the Products page does its own paginated fetch instead
 * of using this hook.
 */
export function useProductSearch(query, { limit = 6 } = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    const trimmed = query?.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ search: trimmed, limit: String(limit) });
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        setResults(res.ok && data.success ? data.products : []);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query, limit]);

  return { results, loading };
}
