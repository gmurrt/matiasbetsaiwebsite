// src/services/openAiService.js

/**
 * Service to interact with OpenAI API
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only use this in development
});

/**
 * Generates betting predictions for an event using OpenAI's GPT model
 * @param {Object} event - Event data including teams, odds, etc.
 * @returns {Promise<Object>} AI-generated predictions and confidence scores
 */
export const generatePredictions = async (event) => {
  try {
    const { homeTeam, awayTeam, sportTitle, odds } = event;
    
    const homeOdds = odds.home ? odds.home.price : 'unavailable';
    const awayOdds = odds.away ? odds.away.price : 'unavailable';
    const drawOdds = odds.draw ? odds.draw.price : 'unavailable';
    
    const prompt = `
      As a sports betting AI analyst, generate a prediction for this upcoming ${sportTitle} game:
      
      Home Team: ${homeTeam}
      Away Team: ${awayTeam}
      
      Current Odds:
      ${homeTeam} (Home): ${homeOdds}
      ${awayTeam} (Away): ${awayOdds}
      ${drawOdds !== 'unavailable' ? `Draw: ${drawOdds}` : ''}
      
      Please analyze this match and provide:
      1. Win probability percentage for each team
      2. Recommended bet with a confidence score (0-100)
      3. Key factors influencing your prediction
      4. A "Sharpness Score" from 0-100 indicating how confident you are in this prediction
      
      Format your response as a valid JSON object with the following structure:
      {
        "prediction": {
          "homeWinProbability": number,
          "awayWinProbability": number,
          "drawProbability": number (if applicable)
        },
        "recommendedBet": {
          "pick": "home"|"away"|"draw",
          "confidence": number,
          "reasoning": "string"
        },
        "keyFactors": ["factor1", "factor2", "factor3"],
        "sharpnessScore": number,
        "isValueBet": boolean,
        "analysis": "string"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response from OpenAI
    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating predictions:', error);
    throw error;
  }
};

/**
 * Identifies potential value bets based on AI analysis vs. bookmaker odds
 * @param {Object} event - Event data with odds
 * @param {Object} aiPrediction - AI-generated prediction
 * @returns {Object} Value bet analysis
 */
export const identifyValueBets = (event, aiPrediction) => {
  const { odds } = event;
  const { prediction } = aiPrediction;
  
  // Calculate implied probabilities from bookmaker odds
  const calculateImpliedProbability = (americanOdds) => {
    if (!americanOdds) return null;
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  };
  
  const bookmakerImpliedProbabilities = {
    home: odds.home ? calculateImpliedProbability(odds.home.price) : null,
    away: odds.away ? calculateImpliedProbability(odds.away.price) : null,
    draw: odds.draw ? calculateImpliedProbability(odds.draw.price) : null
  };
  
  // Calculate edge (difference between AI probabilities and bookmaker probabilities)
  const edges = {
    home: prediction.homeWinProbability - (bookmakerImpliedProbabilities.home || 0) * 100,
    away: prediction.awayWinProbability - (bookmakerImpliedProbabilities.away || 0) * 100,
    draw: prediction.drawProbability 
      ? prediction.drawProbability - (bookmakerImpliedProbabilities.draw || 0) * 100
      : null
  };
  
  // Find the best value bet (highest positive edge)
  let bestValueBet = null;
  let highestEdge = 0;
  
  Object.entries(edges).forEach(([outcome, edge]) => {
    if (edge !== null && edge > highestEdge && edge > 3) { // Minimum 3% edge to consider a value bet
      highestEdge = edge;
      bestValueBet = {
        outcome,
        edge,
        aiProbability: prediction[`${outcome}WinProbability`] || prediction.drawProbability,
        bookmakerOdds: odds[outcome] ? odds[outcome].price : null,
        bookmaker: odds[outcome] ? odds[outcome].bookmaker : null
      };
    }
  });
  
  return {
    edges,
    bestValueBet,
    hasValueBet: bestValueBet !== null
  };
};

/**
 * Generates a "sharpness score" for a prediction
 * @param {Object} event - Event data
 * @param {Object} prediction - AI prediction
 * @returns {number} Sharpness score (0-100)
 */
export const calculateSharpnessScore = (event, prediction) => {
  if (!event || !prediction || !prediction.prediction) {
    return 0;
  }

  const { prediction: probabilities } = prediction;
  
  // Calculate confidence component (50% of score)
  const confidenceComponent = prediction.recommendedBet.confidence * 0.5;
  
  // Calculate the gap between highest and second highest probability
  const probArray = [
    probabilities.homeWinProbability, 
    probabilities.awayWinProbability,
    probabilities.drawProbability
  ].filter(Boolean); // Remove any null/undefined values
  
  if (probArray.length < 2) return Math.round(confidenceComponent);
  
  probArray.sort((a, b) => b - a);
  const probabilityGap = probArray[0] - probArray[1];
  const gapComponent = probabilityGap * 2 * 0.5; // 50% of score, gap scaled by factor of 2
  
  return Math.min(100, Math.round(confidenceComponent + gapComponent));
};

/**
 * Identifies potential underdog value bets
 * @param {Array} events - List of events with odds and predictions
 * @returns {Array} Filtered list of underdog value opportunities
 */
export const findUnderdogAlerts = (events) => {
  return events.filter(event => {
    if (!event.aiPrediction || !event.odds) return false;
    
    const { analysis } = event;
    const { recommendedBet } = event.aiPrediction;
    
    // Underdog check - recommended bet is on the underdog
    const isUnderdogPick = analysis.underdog === recommendedBet.pick;
    
    // Value check - AI probability is higher than implied by odds
    const hasValue = event.valueBetAnalysis && event.valueBetAnalysis.hasValueBet;
    
    // Minimum confidence threshold
    const highConfidence = recommendedBet.confidence > 60;
    
    return isUnderdogPick && hasValue && highConfidence;
  }).map(event => ({
    id: event.id,
    homeTeam: event.homeTeam,
    awayTeam: event.awayTeam,
    sportTitle: event.sportTitle,
    commenceTime: event.commenceTime,
    pick: event.aiPrediction.recommendedBet.pick,
    odds: event.odds[event.aiPrediction.recommendedBet.pick],
    confidence: event.aiPrediction.recommendedBet.confidence,
    valueBetEdge: event.valueBetAnalysis.bestValueBet ? event.valueBetAnalysis.bestValueBet.edge : null,
    sharpnessScore: event.aiPrediction.sharpnessScore
  }));
};

/**
 * Analyzes a user's betting history to provide feedback
 * @param {Array} bets - User's past bets
 * @returns {Promise<Object>} AI-generated betting feedback and insights
 */
export const analyzeBettingHistory = async (bets) => {
  if (!bets || bets.length === 0) {
    return [];
  }

  try {
    // Group bets by different categories
    const sportStats = groupBetsByCategory(bets, 'sportTitle');
    const timeStats = analyzeTimePatterns(bets);
    const streakAnalysis = analyzeStreaks(bets);
    
    const insights = [
      generateSportInsights(sportStats),
      generateTimeInsights(timeStats),
      generateStreakInsights(streakAnalysis)
    ].filter(Boolean);

    return insights;
  } catch (error) {
    console.error('Error analyzing betting history:', error);
    throw new Error('Failed to analyze betting history. Please try again.');
  }
};

const groupBetsByCategory = (bets, category) => {
  return bets.reduce((acc, bet) => {
    const key = bet[category];
    if (!acc[key]) {
      acc[key] = {
        wins: 0,
        losses: 0,
        pushes: 0,
        totalStake: 0,
        totalReturn: 0,
        bets: []
      };
    }
    
    acc[key].bets.push(bet);
    acc[key].totalStake += bet.stake;
    acc[key].totalReturn += bet.returnAmount || 0;
    
    if (bet.result === 'win') acc[key].wins++;
    else if (bet.result === 'loss') acc[key].losses++;
    else if (bet.result === 'push') acc[key].pushes++;
    
    return acc;
  }, {});
};

const analyzeTimePatterns = (bets) => {
  // Group bets by day of week and time of day
  const timeAnalysis = {
    byDayOfWeek: Array(7).fill(0).map(() => ({
      wins: 0, losses: 0, pushes: 0, total: 0
    })),
    byTimeOfDay: {
      morning: { wins: 0, losses: 0, pushes: 0, total: 0 },
      afternoon: { wins: 0, losses: 0, pushes: 0, total: 0 },
      evening: { wins: 0, losses: 0, pushes: 0, total: 0 },
      night: { wins: 0, losses: 0, pushes: 0, total: 0 }
    }
  };
  
  bets.forEach(bet => {
    const date = new Date(bet.date);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    // Update day of week stats
    timeAnalysis.byDayOfWeek[dayOfWeek].total++;
    if (bet.result === 'win') timeAnalysis.byDayOfWeek[dayOfWeek].wins++;
    else if (bet.result === 'loss') timeAnalysis.byDayOfWeek[dayOfWeek].losses++;
    else if (bet.result === 'push') timeAnalysis.byDayOfWeek[dayOfWeek].pushes++;
    
    // Update time of day stats
    const timeOfDay = 
      hour < 12 ? 'morning' :
      hour < 17 ? 'afternoon' :
      hour < 22 ? 'evening' : 'night';
    
    timeAnalysis.byTimeOfDay[timeOfDay].total++;
    if (bet.result === 'win') timeAnalysis.byTimeOfDay[timeOfDay].wins++;
    else if (bet.result === 'loss') timeAnalysis.byTimeOfDay[timeOfDay].losses++;
    else if (bet.result === 'push') timeAnalysis.byTimeOfDay[timeOfDay].pushes++;
  });
  
  return timeAnalysis;
};

const analyzeStreaks = (bets) => {
  let currentStreak = 1;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentType = null;
  
  // Sort bets by date
  const sortedBets = [...bets].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  sortedBets.forEach((bet, index) => {
    if (index === 0) {
      currentType = bet.result;
      return;
    }
    
    if (bet.result === currentType && bet.result !== 'pending' && bet.result !== 'push') {
      currentStreak++;
    } else {
      if (currentType === 'win') {
        longestWinStreak = Math.max(longestWinStreak, currentStreak);
      } else if (currentType === 'loss') {
        longestLossStreak = Math.max(longestLossStreak, currentStreak);
      }
      currentStreak = 1;
      currentType = bet.result;
    }
  });
  
  // Check final streak
  if (currentType === 'win') {
    longestWinStreak = Math.max(longestWinStreak, currentStreak);
  } else if (currentType === 'loss') {
    longestLossStreak = Math.max(longestLossStreak, currentStreak);
  }
  
  return { longestWinStreak, longestLossStreak };
};

const generateSportInsights = (sportStats) => {
  const insights = [];
  
  Object.entries(sportStats).forEach(([sport, stats]) => {
    const total = stats.wins + stats.losses;
    if (total < 5) return; // Need minimum sample size
    
    const winRate = (stats.wins / total) * 100;
    const roi = ((stats.totalReturn - stats.totalStake) / stats.totalStake) * 100;
    
    if (winRate > 55) {
      insights.push({
        title: `Strong Performance in ${sport}`,
        description: `You're winning ${winRate.toFixed(1)}% of your bets in ${sport} with ${roi.toFixed(1)}% ROI. Consider focusing more on this sport.`,
        type: 'success',
        confidence: winRate
      });
    } else if (winRate < 45) {
      insights.push({
        title: `Struggling with ${sport}`,
        description: `Your win rate in ${sport} is only ${winRate.toFixed(1)}%. Consider reducing exposure or reviewing your strategy.`,
        type: 'warning',
        confidence: 100 - winRate
      });
    }
  });
  
  return insights;
};

const generateTimeInsights = (timeAnalysis) => {
  const insights = [];
  
  // Analyze best and worst days
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats = timeAnalysis.byDayOfWeek.map((stats, index) => {
    const total = stats.wins + stats.losses;
    return {
      day: dayNames[index],
      winRate: total > 0 ? (stats.wins / total) * 100 : 0,
      total
    };
  });
  
  const bestDay = dayStats.reduce((best, curr) => 
    curr.total >= 5 && curr.winRate > best.winRate ? curr : best
  , { winRate: 0 });
  
  if (bestDay.winRate > 60) {
    insights.push({
      title: `${bestDay.day} Success`,
      description: `You have a ${bestDay.winRate.toFixed(1)}% win rate on ${bestDay.day}s. Consider focusing more on these opportunities.`,
      type: 'success',
      confidence: bestDay.winRate
    });
  }
  
  return insights;
};

const generateStreakInsights = (streakAnalysis) => {
  const insights = [];
  
  if (streakAnalysis.longestWinStreak >= 3) {
    insights.push({
      title: 'Strong Winning Streak',
      description: `Your longest winning streak is ${streakAnalysis.longestWinStreak} bets. This shows potential for consistent success.`,
      type: 'success',
      confidence: 75
    });
  }
  
  if (streakAnalysis.longestLossStreak >= 4) {
    insights.push({
      title: 'Loss Streak Alert',
      description: `You've experienced a ${streakAnalysis.longestLossStreak}-bet losing streak. Consider implementing stop-loss strategies.`,
      type: 'warning',
      confidence: 80
    });
  }
  
  return insights;
};

// Export service functions
export default {
  generatePredictions,
  identifyValueBets,
  calculateSharpnessScore,
  findUnderdogAlerts,
  analyzeBettingHistory
};