import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
    </svg>
  );
}

type View = 'login' | 'signup' | 'forgot' | 'reset';

export default function AuthScreen() {
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (view === 'login') {
      const res = await signIn(email.trim(), password);
      if (res.error) setError(res.error);
    } else if (view === 'signup') {
      const res = await signUp(email.trim(), password, username, fullName);
      if (res.error) setError(res.error);
    } else if (view === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset`,
      });
      if (error) setError(error.message);
      else setInfo('Reset link sent! Check your email inbox.');
    } else if (view === 'reset') {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message);
      else {
        setInfo('Password updated! You can now sign in.');
        setView('login');
      }
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ig-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 text-white shadow-lg">
            <Camera size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Air Insta</h1>
          <p className="text-sm text-ig-muted">
            {view === 'login' && 'Sign in to share your moments.'}
            {view === 'signup' && 'Create your account in seconds.'}
            {view === 'forgot' && 'Get a link to reset your password.'}
            {view === 'reset' && 'Choose a new password.'}
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-3 p-5">
          {view === 'signup' && (
            <>
              <input
                className="input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <input
                className="input"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </>
          )}
          {(view === 'login' || view === 'signup' || view === 'forgot') && (
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-ig-muted" />
              <input
                className="input pl-9"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          )}
          {(view === 'login' || view === 'signup' || view === 'reset') && (
            <input
              className="input"
              type="password"
              placeholder={view === 'reset' ? 'New password' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={view === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}
          {info && (
            <p className="flex items-start gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              {info}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {view === 'login' && 'Sign in'}
            {view === 'signup' && 'Create account'}
            {view === 'forgot' && 'Send reset link'}
            {view === 'reset' && 'Update password'}
          </button>
        </form>

        {(view === 'login' || view === 'signup') && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-ig-border" />
              <span className="text-xs font-semibold text-ig-muted">OR</span>
              <div className="h-px flex-1 bg-ig-border" />
            </div>
            <div className="space-y-2">
              <button
                onClick={() => signInWithOAuth('google')}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-ig-border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:bg-white dark:hover:bg-gray-100"
              >
                <GoogleIcon size={18} />
                Continue with Google
              </button>
              <button
                onClick={() => signInWithOAuth('instagram')}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-ig-border bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <InstagramIcon size={18} />
                Continue with Instagram
              </button>
            </div>
          </>
        )}

        <div className="mt-4 space-y-2 text-center text-sm">
          {view === 'login' && (
            <>
              <p className="text-ig-muted">
                <button
                  className="font-semibold text-ig-accent hover:underline"
                  onClick={() => { setView('forgot'); setError(null); setInfo(null); }}
                >
                  Forgot password?
                </button>
              </p>
              <p className="text-ig-muted">
                Don't have an account?{' '}
                <button
                  className="font-semibold text-ig-accent hover:underline"
                  onClick={() => { setView('signup'); setError(null); setInfo(null); }}
                >
                  Sign up
                </button>
              </p>
            </>
          )}
          {view === 'signup' && (
            <p className="text-ig-muted">
              Already have an account?{' '}
              <button
                className="font-semibold text-ig-accent hover:underline"
                onClick={() => { setView('login'); setError(null); setInfo(null); }}
              >
                Sign in
              </button>
            </p>
          )}
          {(view === 'forgot' || view === 'reset') && (
            <p>
              <button
                className="inline-flex items-center gap-1 font-semibold text-ig-accent hover:underline"
                onClick={() => { setView('login'); setError(null); setInfo(null); }}
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
