import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from './sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  return (
    <div className="h-screen flex gap-4 p-4 bg-background">
      <Sidebar
        displayName={profile?.full_name || user.email || ''}
        role={profile?.role || 'manager'}
      />
      <main className="flex-1 glass rounded-2xl p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
