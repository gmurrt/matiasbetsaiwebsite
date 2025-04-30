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
      <div className="picks-filters">
        <select 
          value={sport} 
          onChange={(e) => setSport(e.target.value)}
          className="picks-filter-select"
        >
          <option value="all">All Sports</option>
          <option value="nba">NBA</option>
          <option value="nfl">NFL</option>
          <option value="mlb">MLB</option>
          <option value="nhl">NHL</option>
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
      </div>

      <div className="picks-grid">
        {/* Example Pick Cards */}
        <div className="pick-card">
          <div className="pick-header">
            <div className="pick-teams">
              <div className="pick-league">NBA</div>
              <div className="pick-matchup">Lakers vs Warriors</div>
            </div>
            <div className="pick-confidence">85% Confidence</div>
          </div>
          
          <div className="pick-details">
            <div className="pick-info">
              <Calendar className="icon" />
              <span>Today, 7:30 PM EST</span>
            </div>
            <div className="pick-info">
              <Clock className="icon" />
              <span>Tip-off in 4 hours</span>
            </div>
            <div className="pick-info">
              <TrendingUp className="icon" />
              <span>Line Movement: -3.5 → -4.5</span>
            </div>
            <div className="pick-info">
              <Percent className="icon" />
              <span>Value Rating: High</span>
            </div>
          </div>

          <div className="pick-prediction">
            <div className="pick-prediction-label">AI Prediction</div>
            <div className="pick-prediction-value">Lakers -4.5 (85%)</div>
          </div>
        </div>

        {/* More example cards... */}
        <div className="pick-card">
          <div className="pick-header">
            <div className="pick-teams">
              <div className="pick-league">NFL</div>
              <div className="pick-matchup">Chiefs vs Eagles</div>
            </div>
            <div className="pick-confidence">78% Confidence</div>
          </div>
          
          <div className="pick-details">
            <div className="pick-info">
              <Calendar className="icon" />
              <span>Tomorrow, 4:25 PM EST</span>
            </div>
            <div className="pick-info">
              <Clock className="icon" />
              <span>Kickoff in 28 hours</span>
            </div>
            <div className="pick-info">
              <TrendingUp className="icon" />
              <span>Line Movement: +2.5 → +3</span>
            </div>
            <div className="pick-info">
              <Percent className="icon" />
              <span>Value Rating: Medium</span>
            </div>
          </div>

          <div className="pick-prediction">
            <div className="pick-prediction-label">AI Prediction</div>
            <div className="pick-prediction-value">Chiefs +3 (78%)</div>
          </div>
        </div>

        <div className="pick-card">
          <div className="pick-header">
            <div className="pick-teams">
              <div className="pick-league">MLB</div>
              <div className="pick-matchup">Yankees vs Red Sox</div>
            </div>
            <div className="pick-confidence">92% Confidence</div>
          </div>
          
          <div className="pick-details">
            <div className="pick-info">
              <Calendar className="icon" />
              <span>Today, 1:05 PM EST</span>
            </div>
            <div className="pick-info">
              <Clock className="icon" />
              <span>First Pitch in 2 hours</span>
            </div>
            <div className="pick-info">
              <TrendingUp className="icon" />
              <span>Line Movement: O8.5 → O9</span>
            </div>
            <div className="pick-info">
              <Percent className="icon" />
              <span>Value Rating: Very High</span>
            </div>
          </div>

          <div className="pick-prediction">
            <div className="pick-prediction-label">AI Prediction</div>
            <div className="pick-prediction-value">Over 9 (92%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}