// src/stores/betTrackerStore.js

import { createContext, useContext, useEffect, useState } from 'react';
import { getFirestore, collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import openAiService from '../services/openAiService';

// Create context
const BetTrackerContext = createContext();

export const useBetTracker = () => useContext(BetTrackerContext);

export const BetTrackerProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [filters, setFilters] = useState({
    sport: '',
    result: '',
    startDate: '',
    endDate: '',
    isAiPick: undefined
  });
  const db = getFirestore();

  // Load user's bets from Firestore
  useEffect(() => {
    const fetchBets = async () => {
      if (!currentUser) {
        setBets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const betsQuery = query(
          collection(db, 'bets'),
          where('userId', '==', currentUser.uid),
          orderBy('date', 'desc')
        );
        
        const snapshot = await getDocs(betsQuery);
        const betsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
          eventDate: doc.data().eventDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate(),
          settledAt: doc.data().settledAt?.toDate()
        }));
        
        setBets(betsList);
        calculateStats(betsList);
      } catch (err) {
        console.error('Error fetching bets:', err);
        setError('Failed to load bets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [currentUser, db]);

  // Calculate betting statistics
  const calculateStats = (betsList) => {
    if (!betsList || betsList.length === 0) {
      setStats({
        totalBets: 0,
        winCount: 0,
        lossCount: 0,
        pushCount: 0,
        winRate: 0,
        totalStake: 0,
        totalReturn: 0,
        profit: 0,
        roi: 0
      });
      return;
    }

    const initialStats = {
      totalBets: betsList.length,
      winCount: 0,
      lossCount: 0,
      pushCount: 0,
      totalStake: 0,
      totalReturn: 0
    };

    const calculatedStats = betsList.reduce((stats, bet) => {
      // Count results
      if (bet.result === 'win') stats.winCount++;
      else if (bet.result === 'loss') stats.lossCount++;
      else if (bet.result === 'push') stats.pushCount++;
      
      // Calculate financials
      stats.totalStake += bet.stake;
      
      if (bet.result === 'win') {
        // Calculate return based on odds format (assuming American odds)
        let returnAmount = 0;
        if (bet.odds > 0) {
          returnAmount = bet.stake * (bet.odds / 100) + bet.stake;
        } else {
          returnAmount = bet.stake * (100 / Math.abs(bet.odds)) + bet.stake;
        }
        stats.totalReturn += returnAmount;
      } else if (bet.result === 'push') {
        stats.totalReturn += bet.stake; // Push returns the stake
      }
      
      return stats;
    }, initialStats);

    // Calculate derived stats
    const settleBetsCount = calculatedStats.winCount + calculatedStats.lossCount;
    calculatedStats.winRate = settleBetsCount > 0 
      ? (calculatedStats.winCount / settleBetsCount) * 100 
      : 0;
      
    calculatedStats.profit = calculatedStats.totalReturn - calculatedStats.totalStake;
    calculatedStats.roi = calculatedStats.totalStake > 0 
      ? (calculatedStats.profit / calculatedStats.totalStake) * 100 
      : 0;

    setStats(calculatedStats);
  };

  // Add a new bet to Firestore
  const addBet = async (betData) => {
    if (!currentUser) return null;

    try {
      setLoading(true);
      
      const newBet = {
        ...betData,
        userId: currentUser.uid,
        date: new Date(),
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'bets'), newBet);
      const addedBet = { id: docRef.id, ...newBet };
      
      // Update local state
      const updatedBets = [addedBet, ...bets];
      setBets(updatedBets);
      calculateStats(updatedBets);
      
      return addedBet;
    } catch (error) {
      console.error('Error adding bet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing bet in Firestore
  const updateBet = async (betId, updatedData) => {
    if (!currentUser) return false;

    try {
      setLoading(true);
      
      // Update in Firestore
      const betRef = doc(db, 'bets', betId);
      await updateDoc(betRef, {
        ...updatedData,
        updatedAt: new Date()
      });
      
      // Update local state
      const updatedBets = bets.map(bet => 
        bet.id === betId ? { ...bet, ...updatedData } : bet
      );
      
      setBets(updatedBets);
      calculateStats(updatedBets);
      
      return true;
    } catch (error) {
      console.error('Error updating bet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update bet result
  const updateBetResult = async (betId, result) => {
    let returnAmount = 0;
    const bet = bets.find(b => b.id === betId);
    
    if (bet) {
      if (result === 'win') {
        // Calculate return based on odds format (assuming American odds)
        if (bet.odds > 0) {
          returnAmount = bet.stake * (bet.odds / 100) + bet.stake;
        } else {
          returnAmount = bet.stake * (100 / Math.abs(bet.odds)) + bet.stake;
        }
      } else if (result === 'push') {
        returnAmount = bet.stake; // Push returns the stake
      }
    }
    
    return updateBet(betId, { 
      result, 
      returnAmount,
      settledAt: new Date()
    });
  };

  // Log a pick from the AI prediction
  const logPickFromPrediction = async (event, prediction) => {
    if (!currentUser || !event || !prediction) return null;

    try {
      const { recommendedBet } = prediction;
      const pickTeam = recommendedBet.pick === 'home' 
        ? event.homeTeam 
        : recommendedBet.pick === 'away' 
          ? event.awayTeam 
          : 'Draw';
      
      const betData = {
        sportKey: event.sportKey,
        sportTitle: event.sportTitle,
        eventId: event.id,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        selectedTeam: pickTeam,
        pick: recommendedBet.pick,
        odds: event.odds[recommendedBet.pick]?.price || 0,
        bookmaker: event.odds[recommendedBet.pick]?.bookmaker || '',
        confidence: recommendedBet.confidence,
        reasoning: recommendedBet.reasoning,
        sharpnessScore: prediction.sharpnessScore,
        betType: 'moneyline', // Default to moneyline for simplicity
        stake: 0, // User will need to set stake amount
        result: 'pending',
        isAiPick: true,
        eventDate: new Date(event.commenceTime)
      };
      
      return addBet(betData);
    } catch (error) {
      console.error('Error logging pick from prediction:', error);
      throw error;
    }
  };

  // Get AI-generated insights on betting performance
  const getAiInsights = async () => {
    if (!currentUser || bets.length < 5) {
      // Need at least 5 bets to generate meaningful insights
      return null;
    }

    try {
      setAiLoading(true);
      const analysis = await openAiService.analyzeBettingHistory(bets);
      setInsights(analysis);
      return analysis;
    } catch (error) {
      console.error('Error getting AI insights:', error);
      throw error;
    } finally {
      setAiLoading(false);
    }
  };

  // Get betting performance by category (sport, team, bet type)
  const getPerformanceByCategory = (category) => {
    if (!bets || bets.length === 0) return [];
    
    const categories = {};
    
    bets.forEach(bet => {
      let categoryKey;
      
      switch(category) {
        case 'sport':
          categoryKey = bet.sportTitle;
          break;
        case 'team':
          categoryKey = bet.selectedTeam;
          break;
        case 'betType':
          categoryKey = bet.betType;
          break;
        default:
          categoryKey = 'unknown';
      }
      
      if (!categories[categoryKey]) {
        categories[categoryKey] = {
          name: categoryKey,
          totalBets: 0,
          winCount: 0,
          lossCount: 0,
          pushCount: 0,
          totalStake: 0,
          totalReturn: 0
        };
      }
      
      categories[categoryKey].totalBets++;
      
      if (bet.result === 'win') categories[categoryKey].winCount++;
      else if (bet.result === 'loss') categories[categoryKey].lossCount++;
      else if (bet.result === 'push') categories[categoryKey].pushCount++;
      
      categories[categoryKey].totalStake += bet.stake || 0;
      categories[categoryKey].totalReturn += bet.returnAmount || 0;
    });
    
    // Calculate derived stats for each category
    return Object.values(categories).map(cat => {
      const settleBetsCount = cat.winCount + cat.lossCount;
      const winRate = settleBetsCount > 0 ? (cat.winCount / settleBetsCount) * 100 : 0;
      const profit = cat.totalReturn - cat.totalStake;
      const roi = cat.totalStake > 0 ? (profit / cat.totalStake) * 100 : 0;
      
      return {
        ...cat,
        winRate,
        profit,
        roi
      };
    }).sort((a, b) => b.totalBets - a.totalBets);
  };

  // Filter bets by various criteria
  const filterBets = (filters) => {
    if (!bets || bets.length === 0) return [];
    
    return bets.filter(bet => {
      // Filter by sport
      if (filters.sport && bet.sportTitle !== filters.sport) return false;
      
      // Filter by result
      if (filters.result && bet.result !== filters.result) return false;
      
      // Filter by bet type
      if (filters.betType && bet.betType !== filters.betType) return false;
      
      // Filter by team
      if (filters.team && 
         bet.homeTeam !== filters.team && 
         bet.awayTeam !== filters.team && 
         bet.selectedTeam !== filters.team) return false;
      
      // Filter by date range
      if (filters.startDate && new Date(bet.date) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(bet.date) > new Date(filters.endDate)) return false;
      
      // Filter by AI pick
      if (filters.isAiPick !== undefined && bet.isAiPick !== filters.isAiPick) return false;
      
      return true;
    });
  };

  // Get best performing bets
  const getBestPerformingBets = (limit = 5) => {
    if (!bets || bets.length === 0) return [];
    
    // Only consider winning bets
    const winningBets = bets.filter(bet => bet.result === 'win');
    
    // Sort by ROI (returnAmount / stake)
    return winningBets
      .sort((a, b) => {
        const roiA = (a.returnAmount - a.stake) / a.stake;
        const roiB = (b.returnAmount - b.stake) / b.stake;
        return roiB - roiA;
      })
      .slice(0, limit);
  };

  // Value provided to the context consumer
  return (
    <BetTrackerContext.Provider 
      value={{
        bets,
        loading,
        error,
        stats,
        insights,
        aiLoading,
        filters,
        addBet,
        updateBet,
        updateBetResult,
        logPickFromPrediction,
        getAiInsights,
        getPerformanceByCategory,
        filterBets,
        getBestPerformingBets,
        setFilters
      }}
    >
      {children}
    </BetTrackerContext.Provider>
  );
};

export default BetTrackerProvider;