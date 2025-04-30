'use client';

import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  BarChart, 
  CheckCircle, 
  Filter, 
  Info, 
  RefreshCw, 
  Star, 
  Zap,
  Calendar,
  Clock,
  Percent,
  TrendingUp
} from 'lucide-react';
import { Loading } from '@/components/Loading'; // Adjust the path based on your project structure
import { motion, AnimatePresence } from 'framer-motion';
import oddsApiService from '@/services/oddsApiService';
import openAiService from '@/services/openAiService';
import { useBetTracker } from '@/stores/betTrackerStore';

// Define TypeScript interfaces
interface Sport {
  key: string;
  title: string;
}

interface Odds {
  home: {
    price: number;
    bookmaker: string;
  } | null;
  away: {
    price: number;
    bookmaker: string;
  } | null;
  draw: {
    price: number;
    bookmaker: string;
  } | null;
}

interface Prediction {
  prediction: {
    homeWinProbability: number;
    awayWinProbability: number;
    drawProbability?: number;
  };
  recommendedBet: {
    pick: 'home' | 'away' | 'draw';
    confidence: number;
    reasoning: string;
  };
  keyFactors: string[];
  sharpnessScore: number;
  isValueBet: boolean;
  analysis: string;
}

interface ValueBetAnalysis {
  edges: {
    home: number | null;
    away: number | null;
    draw: number | null;
  };
  bestValueBet: {
    outcome: string;
    edge: number;
    aiProbability: number;
    bookmakerOdds: number | null;
    bookmaker: string | null;
  } | null;
  hasValueBet: boolean;
}

interface Event {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  odds: Odds;
  analysis: any;
  aiPrediction?: Prediction;
  valueBetAnalysis?: ValueBetAnalysis;
}

interface UnderdogAlert {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sportTitle: string;
  commenceTime: string;
  pick: 'home' | 'away' | 'draw';
  odds: {
    price: number;
    bookmaker: string;
  } | null;
  confidence: number;
  valueBetEdge: number | null;
  sharpnessScore: number;
}

const SUPPORTED_SPORTS: Sport[] = [
  { key: 'basketball_nba', title: 'NBA' },
  { key: 'basketball_ncaab', title: 'NCAAB' },
  { key: 'americanfootball_nfl', title: 'NFL' },
  { key: 'baseball_mlb', title: 'MLB' },
  { key: 'icehockey_nhl', title: 'NHL' },
  { key: 'soccer_epl', title: 'EPL' },
  { key: 'soccer_spain_la_liga', title: 'La Liga' },
  { key: 'soccer_italy_serie_a', title: 'Serie A' }
];

export default function AiPicksGenerator() {
  const [selectedSport, setSelectedSport] = useState<string>('basketball_nba');
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [generatingPrediction, setGeneratingPrediction] = useState<boolean>(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [underdogAlerts, setUnderdogAlerts] = useState<UnderdogAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all-events');
  const { logPickFromPrediction } = useBetTracker();
  const [sport, setSport] = useState('all');
  const [confidence, setConfidence] = useState('all');

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const filterVariants = {
    expanded: { height: 'auto', opacity: 1 },
    collapsed: { height: 0, opacity: 0 }
  };

  // Fetch events when selected sport changes
  useEffect(() => {
    fetchEvents(selectedSport);
  }, [selectedSport]);

  // Fetch events for a specific sport
  const fetchEvents = async (sportKey: string) => {
    try {
      setLoadingEvents(true);
      setError(null);
      const eventsWithOdds = await oddsApiService.getUpcomingEventsWithOdds(sportKey);
      setEvents(eventsWithOdds);
      
      // Find underdog alerts
      findUnderdogAlerts(eventsWithOdds);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoadingEvents(false);
    }
  };

  // Generate prediction for a specific event
  const generatePrediction = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    setActiveEventId(eventId);
    setGeneratingPrediction(true);

    try {
      const prediction = await openAiService.generatePredictions(event);
      const valueBetAnalysis = openAiService.identifyValueBets(event, prediction);
      
      // Update the event with prediction
      const updatedEvents = events.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            aiPrediction: prediction as Prediction,
            valueBetAnalysis: valueBetAnalysis as ValueBetAnalysis
          };
        }
        return event;
      });
      
      setEvents(updatedEvents);
      
      // Update underdog alerts
      findUnderdogAlerts(updatedEvents);
    } catch (error) {
      console.error('Error generating prediction:', error);
      setError('Failed to generate prediction. Please try again.');
    } finally {
      setGeneratingPrediction(false);
    }
  };

  // Find underdog value picks
  const findUnderdogAlerts = (eventsList: Event[]) => {
    // Filter for events that have predictions
    const eventsWithPredictions = eventsList.filter(e => e.aiPrediction);
    
    // Use the OpenAI service to find underdog alerts
    const alerts = openAiService.findUnderdogAlerts(eventsWithPredictions);
    setUnderdogAlerts(alerts);
  };

  // Log a bet from an AI prediction
  const handleLogPick = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.aiPrediction) return;

    try {
      await logPickFromPrediction(event, event.aiPrediction);
      // Show success message or notification
    } catch (error) {
      console.error('Error logging pick:', error);
      setError('Failed to log pick. Please try again.');
    }
  };

  // Format American odds for display
  const formatOdds = (odds: number | null | undefined): string => {
    if (!odds) return 'N/A';
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  // Get confidence level color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-500/20 text-green-600';
    if (confidence >= 65) return 'bg-blue-500/20 text-blue-600';
    if (confidence >= 50) return 'bg-yellow-500/20 text-yellow-600';
    return 'bg-red-500/20 text-red-600';
  };

  // Get sharpness score color
  const getSharpnessColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500/20 text-green-600';
    if (score >= 65) return 'bg-blue-500/20 text-blue-600';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-600';
    return 'bg-red-500/20 text-red-600';
  };

  return (
    <div className="picks-container">
      <motion.div 
        className="picks-filters"
        initial="collapsed"
        animate="expanded"
        variants={filterVariants}
      >
        <select 
          value={sport} 
          onChange={(e) => setSport(e.target.value)}
          className="picks-filter-select"
        >
          <option value="all">All Sports</option>
          {SUPPORTED_SPORTS.map(sport => (
            <option key={sport.key} value={sport.key}>
              {sport.title}
            </option>
          ))}
        </select>

        <select 
          value={confidence} 
          onChange={(e) => setConfidence(e.target.value)}
          className="picks-filter-select"
        >
          <option value="all">All Confidence</option>
          <option value="high">High (80%+)</option>
          <option value="medium">Medium (60-80%)</option>
          <option value="low">Low (&lt;60%)</option>
        </select>

        <button
          className="refresh-button"
          onClick={() => fetchEvents(selectedSport)}
          disabled={loadingEvents}
        >
          <RefreshCw className={`icon ${loadingEvents ? 'spin' : ''}`} />
          Refresh Odds
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {loadingEvents ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-state"
          >
            <Loading type="skeleton" rows={6} height="160px" />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="error-container"
          >
            <AlertCircle className="error-icon" />
            <div>
              <h3 className="error-title">Error Loading Picks</h3>
              <p className="error-message">{error}</p>
            </div>
            <button 
              className="error-dismiss"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </motion.div>
        ) : (
          <motion.div 
            className="picks-grid"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <AnimatePresence>
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ delay: index * 0.1 }}
                  className="pick-card"
                >
                  <div className="pick-header">
                    <div className="pick-teams">
                      <div className="pick-league">{event.sportTitle}</div>
                      <div className="pick-matchup">
                        {event.homeTeam} vs {event.awayTeam}
                      </div>
                    </div>
                    {event.aiPrediction ? (
                      <div 
                        className={`pick-confidence ${
                          event.aiPrediction.recommendedBet.confidence >= 80 
                            ? 'high' 
                            : event.aiPrediction.recommendedBet.confidence >= 65 
                              ? 'medium' 
                              : 'low'
                        }`}
                      >
                        {event.aiPrediction.recommendedBet.confidence}% Confidence
                      </div>
                    ) : (
                      <button
                        className="analyze-button"
                        onClick={() => generatePrediction(event.id)}
                        disabled={generatingPrediction && activeEventId === event.id}
                      >
                        {generatingPrediction && activeEventId === event.id ? (
                          <Loading type="spinner" className="button-spinner" />
                        ) : (
                          <>
                            <Zap className="icon" />
                            Analyze
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="pick-details">
                    <div className="pick-info">
                      <Calendar className="icon" />
                      {new Date(event.commenceTime).toLocaleString()}
                    </div>
                    
                    {event.aiPrediction && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pick-prediction"
                      >
                        <div className="pick-prediction-label">AI Pick</div>
                        <div className="pick-prediction-value">
                          {event.aiPrediction.recommendedBet.pick === 'home' 
                            ? event.homeTeam 
                            : event.aiPrediction.recommendedBet.pick === 'away'
                              ? event.awayTeam
                              : 'Draw'
                          }
                        </div>
                        <div className="pick-odds">
                          <TrendingUp className="icon" />
                          {formatOdds(event.odds[event.aiPrediction.recommendedBet.pick]?.price)}
                        </div>
                        {event.valueBetAnalysis?.hasValueBet && (
                          <div className="value-bet-badge">
                            <Star className="icon" />
                            {event.valueBetAnalysis?.bestValueBet 
                              ? `Value Bet (+${event.valueBetAnalysis.bestValueBet.edge.toFixed(1)}% edge)` 
                              : 'No Value Bet'}
                          </div>
                        )}
                        <div className="sharpness-score">
                          <div className="score-label">Sharpness Score</div>
                          <div className={`score-value ${getSharpnessColor(event.aiPrediction.sharpnessScore)}`}>
                            {event.aiPrediction.sharpnessScore}
                          </div>
                        </div>
                        <button 
                          className="log-pick-button"
                          onClick={() => handleLogPick(event.id)}
                        >
                          Log Pick
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}