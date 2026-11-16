'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { useAuth, isTeamEmail, authErrorMessage, TEAM_DOMAIN } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Mode = 'password' | 'link' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const { enabled, ready, email: signedInAs } = useAuth();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const accountUrl = () => `${window.location.origin}/account/`;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = getSupabase();
    if (!supabase) return;
    const addr = email.trim().toLowerCase();
    if (!isTeamEmail(addr)) {
      setError(`Only Iksula team accounts (${TEAM_DOMAIN}) can log in. Guests can use every audit feature without logging in.`);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'password') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: addr, password });
        if (err) return setError(authErrorMessage(err.message));
        router.push('/');
      } else if (mode === 'link') {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: addr,
          options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/` },
        });
        if (err) return setError(authErrorMessage(err.message));
        setInfo('Check your inbox: we sent you a sign-in link.');
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: accountUrl() });
        if (err) return setError(authErrorMessage(err.message));
        setInfo('If this account exists, a password reset email is on its way.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-foreground mb-2">Team login</h1>
      <p className="text-sm text-muted-foreground mb-8">
        For the Iksula QA team: saved reports and one-click comparison. Guests can run audits without logging in.
      </p>

      {!enabled ? (
        <p role="status" className="text-sm text-muted-foreground">Login is not available on this deployment.</p>
      ) : signedInAs ? (
        <div role="status" className="space-y-4">
          <p className="text-sm text-foreground">You are logged in as <strong>{signedInAs}</strong>.</p>
          <div className="flex gap-3">
            <Link href="/" className="underline text-sm">Go to dashboard</Link>
            <Link href="/account/" className="underline text-sm">Account</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">Work email</label>
            <Input id="login-email" type="email" autoComplete="email" placeholder={`name${TEAM_DOMAIN}`}
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">Password</label>
              <Input id="login-password" type="password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {info && <p role="status" className="text-sm text-foreground">{info}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Please wait…' : mode === 'password' ? 'Log in' : mode === 'link' ? 'Email me a sign-in link' : 'Send reset email'}
          </Button>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {mode !== 'password' && <button type="button" className="underline" onClick={() => setMode('password')}>Use password</button>}
            {mode !== 'link' && <button type="button" className="underline" onClick={() => setMode('link')}>Email me a sign-in link</button>}
            {mode !== 'reset' && <button type="button" className="underline" onClick={() => setMode('reset')}>Forgot password?</button>}
          </div>
          <p className="text-xs text-muted-foreground">No account? Accounts are created by invitation only. Ask the PerformancePilot admin.</p>
        </form>
      )}
    </div>
  );
}
