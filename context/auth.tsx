import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  approved: boolean | null;
  refreshApproval: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  approved: null,
  refreshApproval: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchApproval(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('approved, role')
      .eq('id', userId)
      .single();
    if (data) {
      setApproved(data.role === 'manager' ? true : data.approved);
    } else {
      setApproved(false);
    }
    setLoading(false);
  }

  const refreshApproval = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) {
      await fetchApproval(userId);
    }
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchApproval(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchApproval(session.user.id);
      } else {
        setApproved(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setApproved(null);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, approved, refreshApproval, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
