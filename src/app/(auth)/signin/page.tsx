'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <header>
        <div className="container">
          <nav>
            <div className="logo">
              <Link href="/">Matias AI</Link>
            </div>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/signup" className="cta-button">Sign Up</Link>
            </div>
          </nav>
        </div>
      </header>

      <div className="container">
        <div className="auth-container">
          <div className="auth-box">
            <h1>Welcome Back</h1>
            <p>Sign in to your account to continue</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleEmailSignIn}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="cta-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="google-button"
              disabled={loading}
            >
              <img src="/google-icon.svg" alt="Google" />
              Continue with Google
            </button>

            <p className="auth-footer">
              Don't have an account?{' '}
              <Link href="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}