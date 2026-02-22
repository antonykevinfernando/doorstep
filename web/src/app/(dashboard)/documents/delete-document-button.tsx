'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function DeleteDocumentButton({ id, filePath }: { id: string; filePath: string }) {
  const router = useRouter();

  async function handleDelete() {
    const supabase = createClient();
    await supabase.storage.from('documents').remove([filePath]);
    await supabase.from('documents').delete().eq('id', id);
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={handleDelete}>
      Delete
    </Button>
  );
}
