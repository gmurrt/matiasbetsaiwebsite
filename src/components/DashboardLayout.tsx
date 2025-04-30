'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from './Loading';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const currentPath = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Navigation Header */}
      <nav className="nav-container">
        <div className="nav-content">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="nav-logo-text">Matias AI</span>
          </Link>

          <div className="nav-links">
            <Link href="/dashboard" className={`nav-link ${currentPath === '/dashboard' ? 'active' : ''}`}>
              Dashboard
            </Link>
            <Link href="/picks" className={`nav-link ${currentPath === '/picks' ? 'active' : ''}`}>
              AI Picks
            </Link>
            <Link href="/bet-tracker" className={`nav-link ${currentPath === '/bet-tracker' ? 'active' : ''}`}>
              Bet Tracker
            </Link>
          </div>

          <div className="nav-auth">
            {user && (
              <div className="nav-user">
                <div className="nav-user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} />
                  ) : (
                    <span>{getInitials(user.displayName || 'User')}</span>
                  )}
                </div>
                <div className="nav-user-info">
                  <span className="nav-user-name">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                  <span className="nav-user-tier">Free Tier</span>
                </div>
                <button 
                  onClick={handleSignOut} 
                  className="nav-sign-in ml-4"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}