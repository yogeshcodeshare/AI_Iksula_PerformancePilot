import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isTeamEmail, authErrorMessage, AuthProvider } from './auth';
import { __setSupabaseForTests } from './supabase';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/' }));

import LoginPage from '@/app/login/page';
import AccountPage from '@/app/account/page';
import { Navbar } from '@/components/layout/Navbar';

type Fake = ReturnType<typeof fakeSupabase>;
function fakeSupabase(sessionEmail: string | null = null) {
  const session = sessionEmail ? { user: { email: sessionEmail } } : null;
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session } }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  __setSupabaseForTests({ auth } as unknown as SupabaseClient);
  return auth;
}

const renderWithAuth = (ui: React.ReactElement) => render(<AuthProvider>{ui}</AuthProvider>);
const type = async (label: RegExp, value: string) => fireEvent.change(await screen.findByLabelText(label), { target: { value } });

beforeEach(() => push.mockClear());
afterEach(() => __setSupabaseForTests(undefined));

describe('isTeamEmail / authErrorMessage', () => {
  it('accepts only @iksula.com (case-insensitive)', () => {
    expect(isTeamEmail('Asha@Iksula.com')).toBe(true);
    expect(isTeamEmail('asha@gmail.com')).toBe(false);
    expect(isTeamEmail('asha@iksula.com.evil.io')).toBe(false);
    expect(isTeamEmail(null)).toBe(false);
  });
  it('turns Supabase errors into plain messages', () => {
    expect(authErrorMessage('Invalid login credentials')).toBe('Email or password is incorrect.');
    expect(authErrorMessage('Signups not allowed for otp')).toMatch(/not registered/);
    expect(authErrorMessage('weird internal thing')).toBe('Something went wrong. Please try again.');
  });
});

describe('Login page', () => {
  it('when login is not configured, says so and shows no form', async () => {
    __setSupabaseForTests(null);
    renderWithAuth(<LoginPage />);
    expect(await screen.findByText(/Login is not available/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Work email/)).toBeNull();
  });

  it('rejects non-Iksula emails before calling Supabase', async () => {
    const auth = fakeSupabase();
    renderWithAuth(<LoginPage />);
    await type(/Work email/, 'someone@gmail.com');
    await type(/Password/, 'secret123');
    fireEvent.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Only Iksula team accounts/);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('logs in with email + password and goes to the dashboard', async () => {
    const auth = fakeSupabase();
    renderWithAuth(<LoginPage />);
    await type(/Work email/, ' QA@Iksula.com ');
    await type(/Password/, 'secret123');
    fireEvent.click(await screen.findByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'qa@iksula.com', password: 'secret123' });
  });

  it('shows a plain message for wrong credentials', async () => {
    const auth = fakeSupabase();
    auth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    renderWithAuth(<LoginPage />);
    await type(/Work email/, 'qa@iksula.com');
    await type(/Password/, 'nope');
    fireEvent.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(push).not.toHaveBeenCalled();
  });

  it('magic link never creates accounts (shouldCreateUser: false)', async () => {
    const auth: Fake = fakeSupabase();
    renderWithAuth(<LoginPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Email me a sign-in link' }));
    await type(/Work email/, 'qa@iksula.com');
    fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
    expect(await screen.findByText(/Check your inbox/)).toBeInTheDocument();
    expect(auth.signInWithOtp.mock.calls[0][0].options.shouldCreateUser).toBe(false);
  });

  it('forgot password sends a reset email that returns to /account/', async () => {
    const auth = fakeSupabase();
    renderWithAuth(<LoginPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Forgot password?' }));
    await type(/Work email/, 'qa@iksula.com');
    fireEvent.click(screen.getByRole('button', { name: 'Send reset email' }));
    await screen.findByText(/password reset email/);
    expect(auth.resetPasswordForEmail.mock.calls[0][1].redirectTo).toMatch(/\/account\/$/);
  });
});

describe('Account page', () => {
  it('sets a new password after validating it', async () => {
    const auth = fakeSupabase('qa@iksula.com');
    renderWithAuth(<AccountPage />);
    await type(/^New password/, 'short');
    await type(/Confirm password/, 'short');
    fireEvent.click(await screen.findByRole('button', { name: 'Save password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8/);

    await type(/^New password/, 'longenough1');
    await type(/Confirm password/, 'different12');
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/);

    await type(/Confirm password/, 'longenough1');
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
    expect(await screen.findByText('Password saved.')).toBeInTheDocument();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'longenough1' });
  });
});

describe('Navbar account menu', () => {
  it('shows nothing when login is not configured', async () => {
    __setSupabaseForTests(null);
    renderWithAuth(<Navbar />);
    await waitFor(() => expect(screen.queryByText('Team login')).toBeNull());
  });

  it('shows "Team login" for guests', async () => {
    fakeSupabase(null);
    renderWithAuth(<Navbar />);
    expect(await screen.findByRole('link', { name: 'Team login' })).toHaveAttribute('href', expect.stringMatching(/\/login\/?$/));
  });

  it('shows the email and signs out', async () => {
    const auth = fakeSupabase('qa@iksula.com');
    renderWithAuth(<Navbar />);
    expect(await screen.findByText('qa@iksula.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    expect(await screen.findByRole('link', { name: 'Team login' })).toBeInTheDocument();
  });
});
