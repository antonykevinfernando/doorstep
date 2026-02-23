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

    async function fetchDocs() {
      const { data: buildingDocs } = await supabase
        .from('documents')
        .select('id, title, file_path, file_size, created_at')
        .not('building_id', 'is', null)
        .order('created_at', { ascending: false });

      setDocs((buildingDocs ?? []) as DocItem[]);
      setLoading(false);
    }
    fetchDocs();
  }, [user]);

  return { docs, loading };
}
