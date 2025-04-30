'use client';

import { useState, useEffect } from 'react';
import { useBetTracker } from '@/stores/betTrackerStore';
import { BarChart, DollarSign, Calendar, BookOpen, CheckCircle, XCircle, HelpCircle, Zap, Brain, AlertCircle } from 'lucide-react';

type FilterField = 'sport' | 'result' | 'startDate' | 'endDate' | 'isAiPick';

interface Bet {
  id: string;
  result: 'pending' | 'win' | 'loss' | 'push';
  sportKey: string;
  sportTitle: string;
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  selectedTeam: string;
  pick: 'home' | 'away' | 'draw';
  odds: number;
  bookmaker: string;
  confidence: number;
  reasoning: string;
  sharpnessScore: number;
  betType: string;
  stake: number;
  returnAmount: number;
  isAiPick: boolean;
  eventDate: string;
  date: Date;
  createdAt: Date;
  updatedAt?: Date;
  settledAt?: Date;
}

interface Insight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
  confidence: number;
}

interface SportPerformance {
  name: string;
  totalBets: number;
  winCount: number;
  lossCount: number;
  pushCount: number;
  totalStake: number;
  totalReturn: number;
  winRate: number;
  profit: number;
  roi: number;
}

export default function BetTracker() {
  const { 
    bets, 
    loading, 
    stats, 
    insights, 
    aiLoading, 
    updateBetResult, 
    getAiInsights,
    getPerformanceByCategory,
    filterBets
  } = useBetTracker();
  
  const [activeTab, setActiveTab] = useState('active-bets');
  const [selectedBet, setSelectedBet] = useState(null);
  const [filters, setFilters] = useState({
    sport: '',
    result: '',
    startDate: '',
    endDate: '',
    isAiPick: undefined
  });
  const [filteredBets, setFilteredBets] = useState<Bet[]>([]);
  const [sportPerformance, setSportPerformance] = useState<SportPerformance[]>([]);
  const [error, setError] = useState(null);

  // Apply filters when filter state changes
  useEffect(() => {
    const filtered = filterBets(filters);
    setFilteredBets(filtered);
  }, [filters, bets, filterBets]);

  // Calculate category performance stats
  useEffect(() => {
    if (bets.length > 0) {
      const sportStats = getPerformanceByCategory('sport');
      setSportPerformance(sportStats);
    }
  }, [bets, getPerformanceByCategory]);

  // Handle filter changes
  const handleFilterChange = (field: FilterField, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      sport: '',
      result: '',
      startDate: '',
      endDate: '',
      isAiPick: undefined
    });
  };

  // Format currency for display
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format percentage for display
  const formatPercentage = (percentage: number | undefined | null) => {
    if (percentage === undefined || percentage === null) return '0%';
    return `${percentage.toFixed(1)}%`;
  };

  // Get active and settled bets
  const getActiveBets = () => {
    return filteredBets.filter(bet => bet.result === 'pending');
  };

  const getSettledBets = () => {
    return filteredBets.filter(bet => bet.result !== 'pending');
  };

  return (
    <div className="bet-tracker">
      <div className="bet-header">
        <button 
          className="filter-button"
          onClick={resetFilters}
        >
          Reset Filters
        </button>
      </div>

      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="bet-stats">
        <div className="stat-card">
          <div className="stat-header">
            <BarChart className="icon" /> Win Rate
          </div>
          <div className="stat-value">
            {loading ? 'Loading...' : formatPercentage(stats?.winRate || 0)}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <DollarSign className="icon" /> Profit/Loss
          </div>
          <div className="stat-value">
            {loading ? 'Loading...' : formatCurrency(stats?.profit || 0)}
          </div>
          <div className="stat-trend">
            ROI: 
            <span className={stats?.roi >= 0 ? 'trend-positive' : 'trend-negative'}>
              {formatPercentage(stats?.roi || 0)}
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <BookOpen className="icon" /> Total Bets
          </div>
          <div className="stat-value">
            {loading ? 'Loading...' : stats?.totalBets || 0}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bet-filters">
        <h3 className="filter-title">Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Sport</label>
            <select
              className="filter-select"
              value={filters.sport}
              onChange={(e) => handleFilterChange('sport', e.target.value)}
            >
              <option value="">All Sports</option>
              {sportPerformance.map(sport => (
                <option key={sport.name} value={sport.name}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Result</label>
            <select
              className="filter-select"
              value={filters.result}
              onChange={(e) => handleFilterChange('result', e.target.value)}
            >
              <option value="">All Results</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
              <option value="push">Pushes</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">From Date</label>
            <input
              type="date"
              className="filter-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">To Date</label>
            <input
              type="date"
              className="filter-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-button ${filters.isAiPick === true ? 'active' : ''}`}
            onClick={() => handleFilterChange('isAiPick', true)}
          >
            <Zap className="icon" />
            AI Picks Only
          </button>
          <button
            className={`filter-button ${filters.isAiPick === false ? 'active' : ''}`}
            onClick={() => handleFilterChange('isAiPick', false)}
          >
            <BookOpen className="icon" />
            Manual Picks Only
          </button>
          <button
            className={`filter-button ${filters.isAiPick === undefined ? 'active' : ''}`}
            onClick={() => handleFilterChange('isAiPick', undefined)}
          >
            All Picks
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bet-tabs">
        <nav className="tabs-nav">
          <button
            className={`tab-button ${activeTab === 'active-bets' ? 'active' : ''}`}
            onClick={() => setActiveTab('active-bets')}
          >
            Active Bets ({getActiveBets().length})
          </button>
          <button
            className={`tab-button ${activeTab === 'settled-bets' ? 'active' : ''}`}
            onClick={() => setActiveTab('settled-bets')}
          >
            Settled Bets ({getSettledBets().length})
          </button>
          <button
            className={`tab-button ${activeTab === 'ai-insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-insights')}
          >
            AI Feedback
          </button>
        </nav>
        
        <div className="tab-content">
          {/* Active Bets Tab */}
          {activeTab === 'active-bets' && (
            <div className="bet-cards">
              {getActiveBets().map(bet => (
                <div key={bet.id} className="bet-card">
                  <div className="bet-header">
                    <div className="bet-teams">
                      <div className="bet-league">{bet.sportTitle}</div>
                      <div className="bet-matchup">{bet.homeTeam} vs {bet.awayTeam}</div>
                    </div>
                    <div className="bet-status status-pending">Pending</div>
                  </div>
                  
                  <div className="bet-details">
                    <div className="bet-info">
                      <Calendar className="icon" />
                      {new Date(bet.eventDate).toLocaleDateString()}
                    </div>
                    <div className="bet-info">
                      <DollarSign className="icon" />
                      <span className="bet-amount">{formatCurrency(bet.stake)}</span>
                    </div>
                    {bet.isAiPick && (
                      <div className="bet-info">
                        <Zap className="icon" />
                        AI Pick
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Settled Bets Tab */}
          {activeTab === 'settled-bets' && (
            <div className="bet-cards">
              {getSettledBets().map(bet => (
                <div key={bet.id} className="bet-card">
                  <div className="bet-header">
                    <div className="bet-teams">
                      <div className="bet-league">{bet.sportTitle}</div>
                      <div className="bet-matchup">{bet.homeTeam} vs {bet.awayTeam}</div>
                    </div>
                    <div className={`bet-status status-${bet.result}`}>
                      {bet.result.charAt(0).toUpperCase() + bet.result.slice(1)}
                    </div>
                  </div>
                  
                  <div className="bet-details">
                    <div className="bet-info">
                      <Calendar className="icon" />
                      {new Date(bet.eventDate).toLocaleDateString()}
                    </div>
                    <div className="bet-info">
                      <DollarSign className="icon" />
                      <span className="bet-amount">
                        {formatCurrency(bet.returnAmount - bet.stake)}
                      </span>
                    </div>
                    {bet.isAiPick && (
                      <div className="bet-info">
                        <Zap className="icon" />
                        AI Pick
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* AI Insights Tab */}
          {activeTab === 'ai-insights' && (
            <div className="insights-container">
              {aiLoading ? (
                <div>Loading insights...</div>
              ) : insights ? (
                insights.map((insight: Insight, index: number) => (
                  <div key={index} className="insight-card">
                    <div className="insight-header">
                      <Brain className="icon" />
                      {insight.title}
                    </div>
                    <div className="insight-content">
                      {insight.description}
                    </div>
                  </div>
                ))
              ) : (
                <div className="insight-card">
                  <div className="insight-header">
                    <AlertCircle className="icon" />
                    No Insights Available
                  </div>
                  <div className="insight-content">
                    Place more bets to receive AI-powered insights about your betting performance.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}