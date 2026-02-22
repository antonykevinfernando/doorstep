import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateMoveDialog } from './create-move-dialog';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
};

export default async function MovesPage() {
  const supabase = await createClient();

  const { data: moves } = await supabase
    .from('moves')
    .select(`
      *,
      resident:profiles!moves_resident_id_fkey(full_name),
      unit:units!moves_unit_id_fkey(number, floor, building:buildings!units_building_id_fkey(name))
    `)
    .order('scheduled_date', { ascending: false });

  const { data: units } = await supabase
    .from('units')
    .select('id, number, floor, building:buildings!units_building_id_fkey(name)');

  const { data: residents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'resident');

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moves</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {moves?.length ?? 0} total moves
          </p>
        </div>
        <CreateMoveDialog units={units ?? []} residents={residents ?? []} buildings={buildings ?? []} />
      </div>

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resident</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!moves || moves.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No moves yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {moves?.map((move: any) => (
              <TableRow key={move.id}>
                <TableCell className="font-medium">
                  {move.resident?.full_name || '—'}
                </TableCell>
                <TableCell>{move.unit?.number || '—'}</TableCell>
                <TableCell>{move.unit?.building?.name || '—'}</TableCell>
                <TableCell className="capitalize">
                  {move.type?.replace('_', ' ')}
                </TableCell>
                <TableCell>
                  {new Date(move.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[move.status] ?? ''}>
                    {move.status?.replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
