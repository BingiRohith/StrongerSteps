import { FolderTree } from 'lucide-react';
import PagePlaceholder from '@/components/admin/PagePlaceholder';

export default function AdminCategoriesPage() {
  return (
    <PagePlaceholder
      icon={FolderTree}
      title="Categories"
      description="Organize blog and content categories from here once category management is built."
    />
  );
}
