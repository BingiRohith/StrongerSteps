export default function StatusBadge({ status }) {
  const isPublished = status === 'published';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        isPublished ? 'bg-primary-light/20 text-primary-dark' : 'bg-accent-soft text-accent-dark'
      }`}
    >
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
}
