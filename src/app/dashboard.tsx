'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './auth';
import Link from 'next/link';

interface Pick {
  id: number;
  sport: string;
  teams: string;
  pick: string;
  confidence: number;
  startTime: string;
  odds: string;
}

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todaysPicks, setTodaysPicks] = useState<Pick[]>([]);
  const [userTier, setUserTier] = useState('free');

  // Simulated data for example
  const dummyPicks = [
    {
      id: 1,
      sport: 'NBA',
      teams: 'Lakers vs Celtics',
      pick: 'Lakers -4.5',
      confidence: 87,
      startTime: new Date(Date.now() + 3600000).toLocaleTimeString(),
      odds: '-110',
    },
    {
      id: 2,
      sport: 'MLB',
      teams: 'Yankees vs Red Sox',
      pick: 'Over 8.5',
      confidence: 79,
      startTime: new Date(Date.now() + 7200000).toLocaleTimeString(),
      odds: '-115',
    },
    {
      id: 3,
      sport: 'NFL',
      teams: 'Chiefs vs Eagles',
      pick: 'Chiefs ML',
      confidence: 68,
      startTime: new Date(Date.now() + 10800000).toLocaleTimeString(),
      odds: '-125',
    }
  ];

  useEffect(() => {
    // Simulate API call to fetch today's picks and user data
    const fetchData = async () => {
      try {
        // In a real app, you would fetch this data from your backend/Firestore
        setTodaysPicks(dummyPicks);
        setUserTier('free'); // Get from user profile in Firestore
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon"></div>
            <div className="logo-text">Matias AI</div>
          </div>
        </div>
        
        <div className="header-center">
          <nav className="main-nav">
            <Link href="dashboard" className="nav-item active">
              Dashboard
            </Link>
            <Link href="/picks" className="nav-item">
              My Picks
            </Link>
            <Link href="/tracker" className="nav-item">
              Bet Tracker
            </Link>
            <Link href="/analytics" className="nav-item">
              Analytics
            </Link>
          </nav>
        </div>
        
        <div className="header-right">
          <div className="user-menu">
            <div className="user-avatar">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="user-info">
              <p className="user-name">{currentUser?.displayName || currentUser?.email?.split('@')[0]}</p>
              <p className="user-tier">{userTier === 'free' ? 'Free Tier' : userTier === 'pro' ? 'Pro Tier' : 'VIP Tier'}</p>
            </div>
            <button className="logout-btn" onClick={logout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        <section className="welcome-section">
          <h1>Welcome, {currentUser?.displayName || currentUser?.email?.split('@')[0]}</h1>
          <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </section>

        <section className="today-picks">
          <div className="section-header">
            <h2>Today's Picks</h2>
            {userTier === 'free' && (
              <Link href="/pricing" className="upgrade-btn">
                Upgrade for All Picks
              </Link>
            )}
          </div>
          
          <div className="picks-container">
            {todaysPicks.map((pick, index) => (
              <div 
                key={pick.id} 
                className={`pick-card ${index > 0 && userTier === 'free' ? 'locked' : ''}`}
              >
                {index > 0 && userTier === 'free' && (
                  <div className="lock-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 11V7C7 5.93913 7.42143 4.92172 8.17157 4.17157C8.92172 3.42143 9.93913 3 11 3H13C14.0609 3 15.0783 3.42143 15.8284 4.17157C16.5786 4.92172 17 5.93913 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>Upgrade to Pro</p>
                  </div>
                )}
                <div className="pick-header">
                  <span className="sport-badge">{pick.sport}</span>
                  <span className="confidence-badge" style={{
                    backgroundColor: pick.confidence >= 80 ? 'rgba(52, 199, 89, 0.15)' : 
                                    pick.confidence >= 70 ? 'rgba(255, 204, 0, 0.15)' : 
                                    'rgba(255, 59, 48, 0.15)',
                    color: pick.confidence >= 80 ? '#34c759' : 
                          pick.confidence >= 70 ? '#ffcc00' : 
                          '#ff3b30'
                  }}>
                    {pick.confidence}% Confidence
                  </span>
                </div>
                <h3 className="match-teams">{pick.teams}</h3>
                <div className="pick-details">
                  <div className="pick-info">
                    <div className="info-label">Pick</div>
                    <div className="info-value">{pick.pick}</div>
                  </div>
                  <div className="pick-info">
                    <div className="info-label">Odds</div>
                    <div className="info-value">{pick.odds}</div>
                  </div>
                  <div className="pick-info">
                    <div className="info-label">Start Time</div>
                    <div className="info-value">{pick.startTime}</div>
                  </div>
                </div>
                <button className="place-bet-btn">Place Bet</button>
              </div>
            ))}
          </div>
        </section>

        <section className="stats-section">
          <h2>Your Betting Stats</h2>
          
          <div className="stats-container">
            <div className="stat-card">
              <h3>Total Bets</h3>
              <p className="stat-value">{userTier === 'free' ? '7' : '32'}</p>
            </div>
            <div className="stat-card">
              <h3>Win Rate</h3>
              <p className="stat-value">{userTier === 'free' ? '57%' : '61%'}</p>
            </div>
            <div className="stat-card">
              <h3>ROI</h3>
              <p className="stat-value">{userTier === 'free' ? '+12%' : '+18%'}</p>
            </div>
          </div>
          
          {userTier === 'free' && (
            <div className="stats-upgrade-banner">
              <p>Upgrade to Pro to unlock advanced analytics and bet tracking features</p>
              <Link href="/pricing" className="upgrade-link">
                Upgrade Now
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}