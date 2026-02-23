import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { useMove } from './use-move';

export interface DocItem {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
  source: 'shared' | 'uploaded';
}

export function useDocuments() {
  const { user } = useAuth();
  const { move } = useMove();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function fetchDocs() {
      const { data: moveDocs } = await supabase
        .from('documents')
        .select('id, title, file_path, file_size, created_at')
        .not('move_id', 'is', null);

      const { data: buildingDocs } = await supabase
        .from('documents')
        .select('id, title, file_path, file_size, created_at')
        .not('building_id', 'is', null);

      const shared = [...(moveDocs ?? []), ...(buildingDocs ?? [])];
      const unique = Array.from(new Map(shared.map((d) => [d.id, d])).values());
      const sharedDocs: DocItem[] = unique.map((d) => ({ ...d, source: 'shared' as const }));

      let uploadedDocs: DocItem[] = [];
      if (move) {
        const { data: tasks } = await supabase
          .from('move_tasks')
          .select('id, title, response, completed_at')
          .eq('move_id', move.id)
          .in('type', ['upload_lease', 'upload_insurance'])
          .eq('completed', true);

        uploadedDocs = (tasks ?? [])
          .filter((t: any) => t.response?.file_path)
          .map((t: any) => ({
            id: `task-${t.id}`,
            title: t.title,
            file_path: t.response.file_path,
            file_size: null,
            created_at: t.completed_at ?? new Date().toISOString(),
            source: 'uploaded' as const,
          }));
      }

      const all = [...sharedDocs, ...uploadedDocs];
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDocs(all);
      setLoading(false);
    }
    fetchDocs();
  }, [user, move]);

  return { docs, loading };
}
