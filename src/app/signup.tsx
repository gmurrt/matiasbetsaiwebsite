'use client';

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
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
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

interface UserData {
  email: string;
  displayName: string;
  photoURL?: string;
  authProvider: 'email' | 'google';
}

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  // Create user profile in Firestore
  const createUserProfile = async (userId: string, userData: UserData) => {
    try {
      await setDoc(doc(db, "users", userId), {
        ...userData,
        createdAt: new Date(),
        tier: 'free',
        betHistory: []
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
      setError("Failed to create user profile. Please try again.");
    }
  };

  // Sign up with email and password
  const handleEmailSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile
      await createUserProfile(user.uid, {
        email: user.email || email,
        displayName: user.displayName || email.split('@')[0],
        authProvider: 'email'
      });

      // Send email verification
      await sendEmailVerification(user);
      
      setSuccessMessage('Account created successfully! Please check your email to verify your account.');
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      console.error("Error signing up:", error);
      
      // Handle specific Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        switch(error.code) {
          case 'auth/email-already-in-use':
            setError('This email is already registered. Please sign in instead.');
            break;
          case 'auth/invalid-email':
            setError('Please enter a valid email address.');
            break;
          case 'auth/weak-password':
            setError('Password is too weak. Please choose a stronger password.');
            break;
          default:
            setError('Failed to create account. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign up with Google
  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create user profile for Google sign-ups
      await createUserProfile(user.uid, {
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || undefined,
        authProvider: 'google'
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Error with Google sign up:", error);
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="logo">
          <div className="logo-icon"></div>
          <div className="logo-text">Matias AI</div>
        </div>
        
        <h1>Create your account</h1>
        <p className="subtitle">Join thousands of smart bettors making data-driven decisions</p>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <button 
          className="google-signup-btn"
          onClick={handleGoogleSignUp}
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
        
        <form onSubmit={handleEmailSignUp}>
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
              placeholder="At least 8 characters"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="signup-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="terms-text">
          By signing up, you agree to our <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>
        </p>
        
        <div className="signin-link">
          Already have an account? <Link href="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  );
}