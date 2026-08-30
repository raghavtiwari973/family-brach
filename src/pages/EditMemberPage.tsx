import { useParams } from 'react-router-dom';
import { MemberForm } from '@/components/MemberForm';

export function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <MemberForm editingId={id} />;
}
