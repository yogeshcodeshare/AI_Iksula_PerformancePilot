'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { useAuth, authErrorMessage } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MIN_PASSWORD = 8;

/**
 * Landing page for invite and password-reset links (Supabase signs the user in
 * from the link), and the place to change your password later.
 */
export default function AccountPage() {
  const { enabled, ready, email, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    const { error: err } = await getSupabase()!.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(authErrorMessage(err.message));
    setDone(true);
    setPassword('');
    setConfirm('');
  };

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-foreground mb-6">Account</h1>
      {!enabled ? (
        <p role="status" className="text-sm text-muted-foreground">Login is not available on this deployment.</p>
      ) : !email ? (
        <p role="status" className="text-sm text-muted-foreground">
          You are not logged in. <Link href="/login/" className="underline">Log in</Link>
        </p>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-foreground">Logged in as <strong>{email}</strong></p>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <h2 className="text-sm font-semibold text-foreground">Set a new password</h2>
            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">New password</label>
              <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">Confirm password</label>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {done && <p role="status" className="text-sm text-foreground">Password saved.</p>}
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</Button>
          </form>
          <Button variant="outline" onClick={() => void signOut()}>Sign out</Button>
        </div>
      )}
    </div>
  );
}
