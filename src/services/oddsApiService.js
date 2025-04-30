// src/services/oddsApiService.js

/**
 * Service to interact with The Odds API
 */

const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

/**
 * Fetches available sports from The Odds API
 * @returns {Promise<Array>} List of available sports
 */
export const fetchSports = async () => {
  try {
    const response = await fetch(`${BASE_URL}/sports?apiKey=${API_KEY}`);
    if (!response.ok) {
      throw new Error(`Error fetching sports: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }
};

/**
 * Fetches odds for a specific sport
 * @param {string} sportKey - The sport key (e.g., 'basketball_nba')
 * @param {string} regions - Comma separated list of regions (e.g., 'us,uk,eu')
 * @param {string} markets - Comma separated list of markets (e.g., 'h2h,spreads,totals')
 * @param {string} oddsFormat - Format of odds (e.g., 'decimal', 'american')
 * @param {string} dateFormat - Format of dates (e.g., 'iso', 'unix')
 * @returns {Promise<Array>} List of events with odds
 */
export const fetchOdds = async (
  sportKey,
  regions = 'us',
  markets = 'h2h,spreads,totals',
  oddsFormat = 'american',
  dateFormat = 'iso'
) => {
  try {
    const url = `${BASE_URL}/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}&dateFormat=${dateFormat}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching odds: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching odds for ${sportKey}:`, error);
    throw error;
  }
};

/**
 * Fetches events (games) for a specific sport
 * @param {string} sportKey - The sport key (e.g., 'basketball_nba')
 * @returns {Promise<Array>} List of events
 */
export const fetchEvents = async (sportKey) => {
  try {
    const url = `${BASE_URL}/sports/${sportKey}/scores?apiKey=${API_KEY}&daysFrom=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching events: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching events for ${sportKey}:`, error);
    throw error;
  }
};

/**
 * Parses odds data to extract the best odds for each outcome
 * @param {Object} event - Event data from the API
 * @returns {Object} Processed odds data
 */
export const processOddsData = (event) => {
  if (!event.bookmakers || event.bookmakers.length === 0) {
    return { home: null, away: null, draw: null };
  }

  // Get all bookmakers odds for the main market (h2h)
  const allOdds = [];
  event.bookmakers.forEach(bookmaker => {
    const h2hMarket = bookmaker.markets.find(market => market.key === 'h2h');
    if (h2hMarket) {
      h2hMarket.outcomes.forEach(outcome => {
        allOdds.push({
          name: outcome.name,
          price: outcome.price,
          bookmaker: bookmaker.title
        });
      });
    }
  });

  // Group by outcome name
  const groupedOdds = {};
  allOdds.forEach(odd => {
    if (!groupedOdds[odd.name]) {
      groupedOdds[odd.name] = [];
    }
    groupedOdds[odd.name].push(odd);
  });

  // Find best odds for each outcome
  const bestOdds = {};
  Object.entries(groupedOdds).forEach(([name, odds]) => {
    // Sort by price (highest odds first for American format)
    odds.sort((a, b) => b.price - a.price);
    bestOdds[name.toLowerCase()] = odds[0];
  });

  return {
    home: bestOdds.home || null,
    away: bestOdds.away || null,
    draw: bestOdds.draw || null
  };
};

/**
 * Calculates implied probability from American odds
 * @param {number} americanOdds - The odds in American format
 * @returns {number} Implied probability (0-1)
 */
export const calculateImpliedProbability = (americanOdds) => {
  if (!americanOdds) return null;
  
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  } else {
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
};

/**
 * Analyzes odds to find potential value bets
 * @param {Object} processedOdds - Processed odds data
 * @returns {Object} Analysis results
 */
export const analyzeOdds = (processedOdds) => {
  const { home, away, draw } = processedOdds;
  
  // Calculate implied probabilities
  const homeProb = home ? calculateImpliedProbability(home.price) : null;
  const awayProb = away ? calculateImpliedProbability(away.price) : null;
  const drawProb = draw ? calculateImpliedProbability(draw.price) : null;
  
  // Calculate total implied probability (to check for arbitrage opportunities)
  let totalProb = 0;
  if (homeProb) totalProb += homeProb;
  if (awayProb) totalProb += awayProb;
  if (drawProb) totalProb += drawProb;
  
  // Check for arbitrage opportunity (if total probability < 1)
  const hasArbitrage = totalProb < 0.98; // Allow for some margin
  
  // Find underdog (team with higher odds)
  let underdog = null;
  if (home && away) {
    underdog = home.price > away.price ? 'home' : 'away';
  }
  
  return {
    impliedProbabilities: {
      home: homeProb,
      away: awayProb,
      draw: drawProb
    },
    totalImpliedProbability: totalProb,
    hasArbitrage,
    underdog
  };
};

/**
 * Gets upcoming events with betting odds and analysis
 * @param {string} sportKey - The sport key
 * @returns {Promise<Array>} Analyzed events with betting opportunities
 */
export const getUpcomingEventsWithOdds = async (sportKey) => {
  try {
    const odds = await fetchOdds(sportKey);
    
    return odds.map(event => {
      const processedOdds = processOddsData(event);
      const analysis = analyzeOdds(processedOdds);
      
      return {
        id: event.id,
        sportKey: event.sport_key,
        sportTitle: event.sport_title,
        commenceTime: event.commence_time,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        odds: processedOdds,
        analysis
      };
    });
  } catch (error) {
    console.error('Error getting upcoming events with odds:', error);
    throw error;
  }
};

// Export the service functions
export default {
  fetchSports,
  fetchOdds,
  fetchEvents,
  processOddsData,
  calculateImpliedProbability,
  analyzeOdds,
  getUpcomingEventsWithOdds
};