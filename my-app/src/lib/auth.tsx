'use client';

/**
 * Invite-only login for the Iksula QA team (Phase B, architecture/database-sop.md).
 * Guests never need this. When Supabase is not configured, `enabled` is false and
 * no login UI is shown anywhere.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export const TEAM_DOMAIN = '@iksula.com';

export function isTeamEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase().endsWith(TEAM_DOMAIN);
}

export interface AuthState {
  /** Supabase is configured, so login is available. */
  enabled: boolean;
  /** First session check has finished (avoid flicker). */
  ready: boolean;
  email: string | null;
  /** Logged in with an @iksula.com account. */
  isTeamMember: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  enabled: false, ready: true, email: null, isTeamMember: false, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }
    setEnabled(true);
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => {
    const email = session?.user?.email ?? null;
    return {
      enabled,
      ready,
      email,
      isTeamMember: isTeamEmail(email),
      signOut: async () => {
        await getSupabase()?.auth.signOut();
        setSession(null);
      },
    };
  }, [enabled, ready, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** Friendly text for Supabase auth errors (never echo raw internals to users). */
export function authErrorMessage(message: string | undefined): string {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first (check your inbox for the invite).';
  if (m.includes('signups not allowed') || m.includes('user not found') || m.includes('only @iksula.com')) {
    return 'This email is not registered. Ask the PerformancePilot admin for an invite.';
  }
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('password') && m.includes('characters')) return 'Password is too short. Use at least 8 characters.';
  return 'Something went wrong. Please try again.';
}
