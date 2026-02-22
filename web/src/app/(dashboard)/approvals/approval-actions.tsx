'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface Props {
  profileId: string;
  buildingId: string | null;
  orgId: string | null;
  unitNumber: string | null;
  moveInDate: string | null;
}

export function ApprovalActions({ profileId, buildingId, orgId, unitNumber, moveInDate }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    if (!buildingId || !orgId) return;
    setLoading(true);
    const supabase = createClient();

    let unitId: string | null = null;

    if (unitNumber) {
      const { data: existingUnit } = await supabase
        .from('units')
        .select('id')
        .eq('building_id', buildingId)
        .eq('number', unitNumber)
        .single();

      if (existingUnit) {
        unitId = existingUnit.id;
      } else {
        const { data: newUnit } = await supabase
          .from('units')
          .insert({ building_id: buildingId, number: unitNumber })
          .select('id')
          .single();
        unitId = newUnit?.id ?? null;
      }
    }

    if (unitId && moveInDate) {
      await supabase.from('moves').insert({
        type: 'move_in',
        status: 'confirmed',
        resident_id: profileId,
        unit_id: unitId,
        scheduled_date: moveInDate,
      });
    }

    await supabase
      .from('profiles')
      .update({ approved: true, org_id: orgId })
      .eq('id', profileId);

    setLoading(false);
    router.refresh();
  }

  async function handleReject() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.admin.deleteUser(profileId).catch(() => {
      // admin API may not be available client-side; just remove profile data
    });
    await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={loading}
        className="gap-1.5"
      >
        <Check size={14} />
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleReject}
        disabled={loading}
        className="text-muted-foreground hover:text-destructive gap-1.5"
      >
        <X size={14} />
        Reject
      </Button>
    </div>
  );
}
