import { createClient } from '@/lib/supabase/server';
import { ElevatorManager } from './elevator-manager';

export default async function ElevatorPage() {
  const supabase = await createClient();
  const { data: buildings } = await supabase.from('buildings').select('id, name');

  return (
    <ElevatorManager buildings={(buildings ?? []).map((b: any) => ({ id: b.id, name: b.name }))} />
  );
}
