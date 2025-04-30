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
  // This would be more complex in a real implementation
  // Factors that could influence sharpness:
  // 1. Consensus among bookmakers (low variance in odds)
  // 2. Amount of historical data available
  // 3. Consistency of team performance
  // 4. Absence of major recent changes (injuries, trades, etc.)
  
  const { recommendedBet, prediction: probabilities } = prediction;
  
  // Simplistic implementation - higher confidence and clearer probability differences
  // indicate a "sharper" prediction
  const confidenceComponent = recommendedBet.confidence * 0.5; // 50% of score
  
  // Calculate the gap between highest and second highest probability
  const probArray = [
    probabilities.homeWinProbability, 
    probabilities.awayWinProbability
  ];
  
  if (probabilities.drawProbability) {
    probArray.push(probabilities.drawProbability);
  }
  
  probArray.sort((a, b) => b - a);
  const probabilityGap = probArray[0] - probArray[1];
  const gapComponent = probabilityGap * 2 * 0.5; // 50% of score, gap scaled by factor of 2
  
  const sharpnessScore = Math.min(100, Math.round(confidenceComponent + gapComponent));
  
  return sharpnessScore;
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
 * @param {Array} betHistory - User's past bets
 * @returns {Promise<Object>} AI-generated betting feedback and insights
 */
export const analyzeBettingHistory = async (betHistory) => {
  try {
    const formatBetHistory = betHistory.map(bet => ({
      sport: bet.sportTitle,
      homeTeam: bet.homeTeam,
      awayTeam: bet.awayTeam,
      selectedTeam: bet.selectedTeam,
      odds: bet.odds,
      stake: bet.stake,
      result: bet.result, // win, loss, push
      betType: bet.betType, // moneyline, spread, total, etc.
      date: bet.date
    }));
    
    const prompt = `
      As a betting performance analyst, review this betting history and provide actionable insights:
      
      ${JSON.stringify(formatBetHistory, null, 2)}
      
      Please analyze this betting history and provide:
      1. Overall performance metrics (win rate, ROI, etc.)
      2. Strengths and weaknesses by sport, bet type, and team selection
      3. Specific patterns or biases in betting behavior
      4. Actionable recommendations to improve results
      5. Specific sports/leagues/bet types where the user is performing well or poorly
      
      Format your response as a valid JSON object with the following structure:
      {
        "overallPerformance": {
          "winRate": number,
          "roi": number,
          "avgOdds": number,
          "totalBets": number,
          "profitLoss": number
        },
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "patterns": ["pattern1", "pattern2"],
        "recommendations": ["recommendation1", "recommendation2"],
        "breakdownBySport": [
          {
            "sport": "string",
            "winRate": number,
            "roi": number,
            "totalBets": number
          }
        ],
        "insightSummary": "string"
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
    console.error('Error analyzing betting history:', error);
    throw error;
  }
};

// Export service functions
export default {
  generatePredictions,
  identifyValueBets,
  calculateSharpnessScore,
  findUnderdogAlerts,
  analyzeBettingHistory
};