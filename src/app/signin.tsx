'use client';

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCalouGPWcCWNBSJpds1OlJ8lkVfPPvSuU",
  authDomain: "matiasbettingapp.firebaseapp.com",
  projectId: "matiasbettingapp",
  storageBucket: "matiasbettingapp.firebasestorage.app",
  messagingSenderId: "506628061889",
  appId: "1:506628061889:web:0f7f0ea22ede42153cf240",
  measurementId: "G-X78HC1HME6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const router = useRouter();

  // Sign in with email and password
  const handleEmailSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing in:", error);
      
      // Handle specific Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        switch(error.code) {
          case 'auth/invalid-email':
            setError('Please enter a valid email address.');
            break;
          case 'auth/user-disabled':
            setError('This account has been disabled. Please contact support.');
            break;
          case 'auth/user-not-found':
            setError('No account found with this email. Please sign up instead.');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password. Please try again or reset your password.');
            break;
          default:
            setError('Failed to sign in. Please check your credentials and try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error with Google sign in:", error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send password reset email
  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      
      // Handle specific Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        switch(error.code) {
          case 'auth/invalid-email':
            setError('Please enter a valid email address.');
            break;
          case 'auth/user-not-found':
            setError('No account found with this email.');
            break;
          default:
            setError('Failed to send reset email. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <div className="logo">
          <div className="logo-icon"></div>
          <div className="logo-text">Matias AI</div>
        </div>
        
        {!isResetMode ? (
          <>
            <h1>Sign in to your account</h1>
            <p className="subtitle">Welcome back! Please enter your details.</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Continue with Google
            </button>
            
            <div className="divider">
              <span>or</span>
            </div>
            
            <form onSubmit={handleEmailSignIn}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
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
                  placeholder="Enter your password"
                />
              </div>
              
              <div className="forgot-password">
                <button 
                  type="button" 
                  className="forgot-password-btn"
                  onClick={() => setIsResetMode(true)}
                >
                  Forgot password?
                </button>
              </div>
              
              <button 
                type="submit" 
                className="signin-btn"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="signup-link">
              Don't have an account? <Link href="/signup">Sign up</Link>
            </div>
          </>
        ) : (
          <>
            <h1>Reset your password</h1>
            <p className="subtitle">Enter your email to receive a password reset link</p>
            
            {error && <div className="error-message">{error}</div>}
            {resetEmailSent && <div className="success-message">Reset link sent! Check your email.</div>}
            
            <form onSubmit={handlePasswordReset}>
              <div className="form-group">
                <label htmlFor="reset-email">Email</label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              
              <button 
                type="submit" 
                className="signin-btn"
                disabled={loading || resetEmailSent}
              >
                {loading ? 'Sending...' : resetEmailSent ? 'Email Sent' : 'Send Reset Link'}
              </button>
              
              <button 
                type="button"
                className="back-to-signin"
                onClick={() => setIsResetMode(false)}
              >
                Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}