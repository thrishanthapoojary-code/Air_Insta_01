import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'instagram') => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error) {
      console.warn('profile load error', error.message);
      setProfile(null);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  const ensureOAuthProfile = useCallback(async (uid: string, email: string | undefined, metadata: Record<string, unknown> | undefined) => {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
    if (existing) return;
    const baseName = String(
      (metadata?.user_name as string) ||
      (metadata?.full_name as string) ||
      (email?.split('@')[0]) ||
      'user',
    ).toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20) || 'user';
    let username = baseName;
    for (let i = 0; i < 10; i++) {
      const { data: clash } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
      if (!clash) break;
      username = `${baseName}${Math.floor(Math.random() * 9000) + 1000}`;
    }
    const fullName = (metadata?.full_name as string) || (metadata?.name as string) || baseName;
    const avatarUrl = (metadata?.avatar_url as string) || (metadata?.picture as string) || null;
    await supabase.from('profiles').insert({
      id: uid,
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      const uid = data.session?.user.id;
      if (uid) {
        loadProfile(uid).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user?.id) {
          const provider = sess.user.app_metadata?.provider as string | undefined;
          if (provider && provider !== 'email') {
            await ensureOAuthProfile(sess.user.id, sess.user.email ?? undefined, sess.user.user_metadata);
          }
          await loadProfile(sess.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, ensureOAuthProfile]);

  const signUp = useCallback(
    async (email: string, password: string, username: string, fullName: string) => {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
      if (cleanUsername.length < 3) return { error: 'Username must be at least 3 characters.' };
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();
      if (existing) return { error: 'That username is taken.' };

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Sign up failed. Try again.' };

      const { error: profileErr } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: cleanUsername,
        full_name: fullName.trim() || cleanUsername,
      });
      if (profileErr) return { error: profileErr.message };
      await loadProfile(data.user.id);
      return { error: null };
    },
    [loadProfile],
  );

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'instagram') => {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          queryParams: provider === 'instagram' ? { scopes: 'user_profile, user_media' } : undefined,
        },
      });
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signUp, signIn, signInWithOAuth, signOut, refreshProfile, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
