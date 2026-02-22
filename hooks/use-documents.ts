import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export interface DocItem {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

export function useDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function fetch() {
      const { data: moveDocs } = await supabase
        .from('documents')
        .select('id, title, file_path, file_size, created_at')
        .not('move_id', 'is', null);

      const { data: buildingDocs } = await supabase
        .from('documents')
        .select('id, title, file_path, file_size, created_at')
        .not('building_id', 'is', null);

      const all = [...(moveDocs ?? []), ...(buildingDocs ?? [])];
      const unique = Array.from(new Map(all.map((d) => [d.id, d])).values());
      unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDocs(unique as DocItem[]);
      setLoading(false);
    }
    fetch();
  }, [user]);

  return { docs, loading };
}
