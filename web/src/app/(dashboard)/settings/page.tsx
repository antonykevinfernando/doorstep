import { createClient } from '@/lib/supabase/server';
import { ProfileSection } from './profile-section';
import { OrgSection } from './org-section';
import { BuildingsSection } from './buildings-section';

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, org_id')
    .eq('id', user!.id)
    .single();

  const { data: org } = profile?.org_id
    ? await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', profile.org_id)
        .single()
    : { data: null };

  const { data: buildings } = profile?.org_id
    ? await supabase
        .from('buildings')
        .select('id, name, address, created_at')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: true })
    : { data: [] };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and organization
        </p>
      </div>

      <div className="space-y-6">
        <ProfileSection
          profile={{ fullName: profile?.full_name ?? '', email: user!.email ?? '', role: profile?.role ?? 'manager' }}
        />

        {org && (
          <OrgSection org={{ id: org.id, name: org.name, slug: org.slug }} />
        )}

        <BuildingsSection
          buildings={(buildings ?? []).map((b: any) => ({ id: b.id, name: b.name, address: b.address }))}
          orgId={profile?.org_id ?? ''}
        />
      </div>
    </div>
  );
}
