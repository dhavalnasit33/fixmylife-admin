'use client';

import { useParams } from 'next/navigation';
import EditPagePage from '@/components/dashboard/pages/EditPageDialog';

export default function EditPage() {
  const { id } = useParams();

  return <EditPagePage id={id as string} />;
}
