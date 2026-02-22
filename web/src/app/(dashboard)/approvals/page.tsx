import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { ApprovalActions } from './approval-actions';

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('profiles')
    .select(`
      id, full_name, created_at, approved,
      requested_building_id, requested_unit_number, requested_move_in_date,
      building:buildings!profiles_requested_building_id_fkey(id, name, org_id)
    `)
    .eq('role', 'resident')
    .eq('approved', false)
    .order('created_at', { ascending: false });

  const { data: approved } = await supabase
    .from('profiles')
    .select(`
      id, full_name, created_at, approved,
      requested_building_id, requested_unit_number, requested_move_in_date,
      building:buildings!profiles_requested_building_id_fkey(id, name)
    `)
    .eq('role', 'resident')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve resident move-in requests
        </p>
      </div>

      {(!pending || pending.length === 0) ? (
        <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-12 text-center text-muted-foreground">
          No pending requests right now.
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map((resident: any) => (
            <div
              key={resident.id}
              className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm px-7 py-6 flex items-center justify-between gap-8"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-semibold truncate text-[15px]">{resident.full_name || 'Unnamed'}</p>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 shrink-0">
                    Pending
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-7 gap-y-1.5 text-sm text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground/70">Building:</span>{' '}
                    {resident.building?.name || '—'}
                  </span>
                  <span>
                    <span className="font-medium text-foreground/70">Unit:</span>{' '}
                    {resident.requested_unit_number || '—'}
                  </span>
                  <span>
                    <span className="font-medium text-foreground/70">Move-in:</span>{' '}
                    {resident.requested_move_in_date
                      ? new Date(resident.requested_move_in_date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                  <span>
                    <span className="font-medium text-foreground/70">Requested:</span>{' '}
                    {new Date(resident.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <ApprovalActions
                profileId={resident.id}
                buildingId={resident.building?.id}
                orgId={resident.building?.org_id}
                unitNumber={resident.requested_unit_number}
                moveInDate={resident.requested_move_in_date}
              />
            </div>
          ))}
        </div>
      )}

      {approved && approved.length > 0 && (
        <div className="mt-14">
          <h2 className="text-lg font-semibold mb-5 text-muted-foreground">Recently approved</h2>
          <div className="grid gap-3">
            {approved.map((resident: any) => (
              <div
                key={resident.id}
                className="rounded-xl border border-black/5 bg-white/40 px-7 py-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{resident.full_name || 'Unnamed'}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {resident.building?.name}
                    {resident.requested_unit_number ? ` · Unit ${resident.requested_unit_number}` : ''}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-sage/40 text-foreground/70">
                  Approved
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
