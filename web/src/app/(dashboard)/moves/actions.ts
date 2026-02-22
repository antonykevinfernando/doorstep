'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface InviteAndCreateMoveInput {
  residentName: string;
  residentEmail: string;
  buildingId: string;
  unitNumber: string;
  type: 'move_in' | 'move_out';
  scheduledDate: string;
  timeSlot?: string;
  notes?: string;
}

export async function inviteResidentAndCreateMove(input: InviteAndCreateMoveInput) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', currentUser.id)
    .single();
  if (!profile?.org_id) return { error: 'No organization found' };

  // Find or create the unit
  let unitId: string | null = null;
  const { data: existingUnit } = await supabase
    .from('units')
    .select('id')
    .eq('building_id', input.buildingId)
    .eq('number', input.unitNumber)
    .single();

  if (existingUnit) {
    unitId = existingUnit.id;
  } else {
    const { data: newUnit, error: unitError } = await admin
      .from('units')
      .insert({ building_id: input.buildingId, number: input.unitNumber })
      .select('id')
      .single();
    if (unitError) return { error: `Failed to create unit: ${unitError.message}` };
    unitId = newUnit?.id ?? null;
  }

  if (!unitId) return { error: 'Failed to resolve unit' };

  // Create user + generate invite link (no email sent — avoids rate limits)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: input.residentEmail,
    options: {
      data: {
        full_name: input.residentName,
        role: 'resident',
      },
    },
  });

  if (linkError) return { error: linkError.message };
  if (!linkData?.user) return { error: 'Failed to create user' };

  const residentId = linkData.user.id;

  // Pre-approve and link to org
  await admin.from('profiles')
    .update({
      approved: true,
      org_id: profile.org_id,
      requested_building_id: input.buildingId,
      requested_unit_number: input.unitNumber,
      requested_move_in_date: input.scheduledDate,
    })
    .eq('id', residentId);

  // Create the move
  const { error: moveError } = await admin.from('moves').insert({
    type: input.type,
    status: 'confirmed',
    resident_id: residentId,
    unit_id: unitId,
    scheduled_date: input.scheduledDate,
    time_slot: input.timeSlot || null,
    notes: input.notes || null,
  });

  if (moveError) return { error: moveError.message };

  return { success: true, inviteLink: linkData.properties?.action_link };
}
