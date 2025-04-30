'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div>
      <nav className={`nav-container ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-content">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon"></div>
            <span className="nav-logo-text">Matias AI</span>
          </Link>

          <div className="nav-links">
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
            <Link href="/picks" className="nav-link">AI Picks</Link>
            <Link href="/bet-tracker" className="nav-link">Bet Tracker</Link>
          </div>

          <div className="nav-auth">
            {user ? (
              <div className="nav-user" onClick={handleSignOut}>
                <div className="nav-user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} />
                  ) : (
                    <span>{getInitials(user.displayName || user.email?.split('@')[0] || 'User')}</span>
                  )}
                </div>
                <div className="nav-user-info">
                  <span className="nav-user-name">{user.displayName || user.email?.split('@')[0]}</span>
                  <span className="nav-user-tier">Free Tier</span>
                </div>
              </div>
            ) : (
              <Link href="/signin" className="nav-sign-in">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
} 