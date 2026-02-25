'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface InviteResidentInput {
  residentName: string;
  residentEmail: string;
  buildingId: string;
  unitNumber: string;
  scheduledDate: string;
}

export async function inviteResident(input: InviteResidentInput) {
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

  await admin.from('profiles')
    .update({
      approved: true,
      org_id: profile.org_id,
      requested_building_id: input.buildingId,
      requested_unit_number: input.unitNumber,
      requested_move_in_date: input.scheduledDate,
    })
    .eq('id', residentId);

  const { data: moveData, error: moveError } = await admin.from('moves').insert({
    type: 'move_in',
    status: 'pending',
    resident_id: residentId,
    unit_id: unitId,
    scheduled_date: input.scheduledDate,
  }).select('id').single();

  if (moveError) return { error: moveError.message };

  if (moveData) {
    const { data: templateItems } = await admin
      .from('checklist_template_items')
      .select('title, type, description, config, sort_order, template:checklist_templates!inner(building_id)')
      .eq('template:checklist_templates.building_id', input.buildingId)
      .order('sort_order', { ascending: true });

    if (templateItems && templateItems.length > 0) {
      await admin.from('move_tasks').insert(
        templateItems.map((item: any, idx: number) => ({
          move_id: moveData.id,
          title: item.title,
          type: item.type,
          description: item.description || null,
          config: item.config || null,
          sort_order: idx,
        })),
      );
    }
  }

  return { success: true, inviteLink: linkData.properties?.action_link };
}

interface UpdateResidentInput {
  residentId: string;
  fullName: string;
  buildingId: string;
  unitNumber: string;
  moveInDate: string;
}

export async function updateResident(input: UpdateResidentInput) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const { error } = await admin.from('profiles').update({
    full_name: input.fullName,
    requested_building_id: input.buildingId,
    requested_unit_number: input.unitNumber,
    requested_move_in_date: input.moveInDate || null,
  }).eq('id', input.residentId);

  if (error) return { error: error.message };

  // Also update the move's scheduled_date if changed
  if (input.moveInDate) {
    let unitId: string | null = null;
    const { data: existingUnit } = await admin
      .from('units')
      .select('id')
      .eq('building_id', input.buildingId)
      .eq('number', input.unitNumber)
      .single();

    if (existingUnit) {
      unitId = existingUnit.id;
    } else {
      const { data: newUnit } = await admin
        .from('units')
        .insert({ building_id: input.buildingId, number: input.unitNumber })
        .select('id')
        .single();
      unitId = newUnit?.id ?? null;
    }

    if (unitId) {
      await admin.from('moves').update({
        scheduled_date: input.moveInDate,
        unit_id: unitId,
      }).eq('resident_id', input.residentId);
    }
  }

  return { success: true };
}

export async function deleteResident(residentId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: 'Not authenticated' };

  // Delete move tasks, then moves, then profile, then auth user
  const { data: moves } = await admin.from('moves').select('id').eq('resident_id', residentId);
  if (moves) {
    for (const m of moves) {
      await admin.from('move_tasks').delete().eq('move_id', m.id);
    }
    await admin.from('moves').delete().eq('resident_id', residentId);
  }

  await admin.from('profiles').delete().eq('id', residentId);
  await admin.auth.admin.deleteUser(residentId);

  return { success: true };
}
