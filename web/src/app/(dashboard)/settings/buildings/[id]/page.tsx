import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BuildingDetail } from './building-detail';

export default async function BuildingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: building } = await supabase
    .from('buildings')
    .select('id, name, address')
    .eq('id', params.id)
    .single();

  if (!building) notFound();

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, file_path, file_size, created_at')
    .eq('building_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <BuildingDetail
      building={{ id: building.id, name: building.name, address: building.address }}
      documents={(documents ?? []).map((d: any) => ({
        id: d.id,
        title: d.title,
        filePath: d.file_path,
        fileSize: d.file_size,
        createdAt: d.created_at,
      }))}
    />
  );
}
