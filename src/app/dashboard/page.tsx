'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AiPicksGenerator from '@/components/AiPicksGenerator';
import BetTracker from '@/components/BetTracker';
import { BetTrackerProvider } from '@/stores/betTrackerStore';
import { BarChart2, ChevronRight, Dices, TrendingUp, Zap } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <BetTrackerProvider>
        <div className="dashboard-welcome">
          <h1>Welcome, {user?.displayName || user?.email?.split('@')[0]}</h1>
          <p>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <nav>
            <button
              onClick={() => setActiveTab('overview')}
              className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('ai-picks')}
              className={`dashboard-tab ${activeTab === 'ai-picks' ? 'active' : ''}`}
            >
              AI Picks
            </button>
            <button
              onClick={() => setActiveTab('bet-tracker')}
              className={`dashboard-tab ${activeTab === 'bet-tracker' ? 'active' : ''}`}
            >
              Bet Tracker
            </button>
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <div className="dashboard-stats">
              {/* Quick Stats Cards */}
              <div className="stat-card">
                <div className="stat-header">
                  <Zap className="icon icon-blue" /> Today's Picks
                </div>
                <div className="stat-value">6</div>
                <p className="stat-label">
                  Across 3 sports
                </p>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <TrendingUp className="icon icon-green" /> Win Rate
                </div>
                <div className="stat-value">62.5%</div>
                <p className="stat-trend">
                  <svg
                    className="icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  4.2% from last week
                </p>
              </div>
              
              <div className="stat-card">
                <div className="stat-header">
                  <Dices className="icon icon-purple" /> Active Bets
                </div>
                <div className="stat-value">3</div>
                <p className="stat-label">
                  $150 total at stake
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="quick-links">
              <div className="quick-link-card">
                <div className="quick-link-header">
                  <h3 className="quick-link-title">
                    <Zap className="icon icon-blue" />
                    AI Picks Generator
                  </h3>
                  <p className="quick-link-description">
                    Get AI-powered betting recommendations with confidence scores.
                  </p>
                </div>
                <button 
                  className="quick-link-button"
                  onClick={() => setActiveTab('ai-picks')}
                >
                  Generate Picks
                  <ChevronRight className="icon" />
                </button>
              </div>
              
              <div className="quick-link-card">
                <div className="quick-link-header">
                  <h3 className="quick-link-title">
                    <BarChart2 className="icon icon-green" />
                    Bet Tracker
                  </h3>
                  <p className="quick-link-description">
                    Track your betting performance and get AI feedback.
                  </p>
                </div>
                <button 
                  className="quick-link-button"
                  onClick={() => setActiveTab('bet-tracker')}
                >
                  Track Bets
                  <ChevronRight className="icon" />
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-card">
              <div className="activity-header">
                <h3 className="activity-title">Recent Activity</h3>
                <p className="activity-subtitle">
                  Your latest bets and predictions
                </p>
              </div>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-item-content">
                    <p className="activity-item-title">NBA: Lakers vs Warriors</p>
                    <p className="activity-item-description">Generated AI prediction (Lakers)</p>
                  </div>
                  <span className="activity-item-time">2 hours ago</span>
                </div>
                
                <div className="activity-item">
                  <div className="activity-item-content">
                    <p className="activity-item-title">NFL: Chiefs vs Eagles</p>
                    <p className="activity-item-description">Logged new bet (Chiefs)</p>
                  </div>
                  <span className="activity-item-time">Yesterday</span>
                </div>
                
                <div className="activity-item">
                  <div className="activity-item-content">
                    <p className="activity-item-title">EPL: Arsenal vs Liverpool</p>
                    <p className="activity-item-description">Updated result (Win)</p>
                  </div>
                  <span className="activity-item-time">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Picks Tab Content */}
        {activeTab === 'ai-picks' && (
          <AiPicksGenerator />
        )}

        {/* Bet Tracker Tab Content */}
        {activeTab === 'bet-tracker' && (
          <BetTracker />
        )}
      </BetTrackerProvider>
    </DashboardLayout>
  );
}