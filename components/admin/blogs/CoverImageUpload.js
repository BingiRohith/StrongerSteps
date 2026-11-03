'use client';

import ImageUploadField from '@/components/admin/infographics/ImageUploadField';

export default function CoverImageUpload({ value, onChange }) {
  return <ImageUploadField value={value} onChange={onChange} heightClass="h-48" />;
}
