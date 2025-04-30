'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, loading, signOut } = useAuth();
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
    <main>
      {/* Header */}
      <header className={`nav-container ${isScrolled ? 'scrolled' : ''}`}>
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
            <Link href="#pricing" className="nav-link">Pricing</Link>
            <Link href="#features" className="nav-link">Features</Link>
            <Link href="#blog" className="nav-link">Blog</Link>
          </div>

          <div className="nav-auth">
            {user ? (
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
                <button onClick={handleSignOut} className="nav-link">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/signin" className="nav-sign-in">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Smarter Bets.<br />Bigger Wins.</h1>
          <p>Daily AI-Powered Picks + Personal Bet Tracking. Unlock data-driven betting strategies and maximize your profits — starting today.</p>
          <div className="hero-buttons">
            {user ? (
              <Link href="/dashboard" className="cta-button no-underline">
                Go to Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ) : (
              <Link href="/signup" className="cta-button no-underline">
                Get Your First Picks Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}
            <button className="cta-button secondary-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7.33333V16.6667L15.8333 12L5 7.33333Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Watch Video
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="section-grid">
            <div className="section-content">
              <h2 className="section-title">Why Bettors Are Switching to Matias AI</h2>
              <p className="section-subtitle">Join thousands of smart bettors who are leveraging AI to make better decisions.</p>
            </div>
            <div className="features">
              <div className="feature">
                <div className="feature-icon">📈</div>
                <h3>AI Precision</h3>
                <p>Thousands of stats analyzed to find the edge. Our models process more data than bookmakers to spot value.</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <h3>Track Your Bets</h3>
                <p>See what's working, cut what's not. Smart tracking reveals your strengths and weaknesses in real-time.</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🚀</div>
                <h3>Win Smarter</h3>
                <p>Make data-backed moves, not emotional guesses. Let AI identify patterns you can't see on your own.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">How It Works (Super Simple)</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-image">Screenshot: Daily Picks View</div>
              <h3>Get Daily Picks</h3>
              <p>AI sends you the top bets based on today's data, predictions, and value opportunities.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-image">Screenshot: Bet Placement View</div>
              <h3>Place Your Bets</h3>
              <p>Follow picks or customize your own plays with confidence based on our AI analysis.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-image">Screenshot: Analytics Dashboard</div>
              <h3>Track & Improve</h3>
              <p>Log your bets and get AI coaching to boost your ROI and refine your strategy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What You Get</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>
                <span>📊</span>
                AI Picks Generator
              </h3>
              <ul className="feature-list">
                <li>Daily Top Picks (Moneylines, Over/Unders, Props)</li>
                <li>Sharpness Score (how confident the AI is)</li>
                <li>Bonus "Underdog Alerts" (high odds value)</li>
                <li>Pre-game analysis with key stats and insights</li>
                <li>Multi-sport coverage for maximum opportunities</li>
              </ul>
            </div>
            <div className="feature-card">
              <h3>
                <span>📈</span>
                Bet Tracker + AI Feedback
              </h3>
              <ul className="feature-list">
                <li>Auto-log picks in 1 click</li>
                <li>Win/Loss Tracking with advanced metrics</li>
                <li>AI Analyzes Your Performance ("You're winning 23% more on NBA Underdogs.")</li>
                <li>Custom suggestions to optimize your bets</li>
                <li>Exportable reports and performance history</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Ready to Win Smarter?</h2>
          <div className="pricing-plans">
            <div className="pricing-card">
              <h3 className="plan-name">Starter</h3>
              <div className="plan-price">$0 <span>/ Free</span></div>
              <ul className="plan-features">
                <li>1 Pick/Day</li>
                <li>Basic Bet Tracker</li>
                <li>Limited Sports Coverage</li>
                <li>Email Support</li>
              </ul>
              <Link href="/signup" className="cta-button">Start Free</Link>
            </div>
            <div className="pricing-card featured">
              <h3 className="plan-name">Pro</h3>
              <div className="plan-price">$19 <span>/ month</span></div>
              <ul className="plan-features">
                <li>All Picks (10-15 daily)</li>
                <li>Full Bet Tracker</li>
                <li>AI Performance Feedback</li>
                <li>All Sports Coverage</li>
                <li>Priority Support</li>
              </ul>
              <Link href="/signup" className="cta-button">Upgrade to Win More</Link>
            </div>
            <div className="pricing-card">
              <h3 className="plan-name">VIP</h3>
              <div className="plan-price">$39 <span>/ month</span></div>
              <ul className="plan-features">
                <li>All Pro Features</li>
                <li>Exclusive AI High-Risk Picks</li>
                <li>Early Access to New Features</li>
                <li>1-on-1 Strategy Session</li>
                <li>VIP Discord Community</li>
              </ul>
              <Link href="/signup" className="cta-button">Join VIP</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Trusted by Thousands of Bettors</h2>
          <div className="testimonials">
            <div className="testimonial">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-content">"I started tracking my bets and realized I was throwing money away. Now I'm up +32%! The AI analysis showed me I was terrible at betting favorites but great at picking totals."</p>
              <div className="testimonial-author">
                <div className="author-avatar"></div>
                <div className="author-info">
                  <h4>Michael T.</h4>
                  <p>Pro Member - 6 months</p>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-content">"The AI picks are scary accurate. Paid for itself in 3 days. I've tried other services but Matias AI understands value betting in a way others don't. My bankroll is up 47% in just a month."</p>
              <div className="testimonial-author">
                <div className="author-avatar"></div>
                <div className="author-info">
                  <h4>Sarah K.</h4>
                  <p>VIP Member - 4 months</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <div className="container">
          <h2>Stop Guessing. Start Winning.</h2>
          <p>Get smarter bets today — and a proven path to more wins.</p>
          <Link href="/signup" className="cta-button">
            Get Started Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="logo">
              <div className="logo-icon"></div>
              <div className="logo-text">Matias AI</div>
            </div>
            <div className="footer-links">
              <Link href="#">About</Link>
              <Link href="#">Terms</Link>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Contact</Link>
              <Link href="#">Telegram</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
