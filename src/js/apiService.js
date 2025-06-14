// src/js/apiService.js
import { apiKey, pageSize, twitchClientId, twitchClientSecret } from './config.js';

// --- RAWG API Functions ---

/**
 * Fetches games from the RAWG API.
 * @param {number} page - The page number to fetch. Defaults to 1.
 * @param {string} searchQuery - The search term (optional).
 * @returns {Promise<Object>} A promise that resolves with the game data.
 */
async function fetchGamesAPI(page = 1, searchQuery = '') {
    let url = `https://api.rawg.io/api/games?key=${apiKey}&page=${page}&page_size=${pageSize}`;
    if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}&search_precise=true`;
    } else {
        url += `&ordering=-relevance`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching games: ${response.statusText}`);
    return await response.json();
}

/**
 * Fetches details of a specific game from the RAWG API.
 * @param {string|number} gameId - The game ID or slug.
 * @returns {Promise<Object>} A promise that resolves with the game details.
 */
async function fetchGameDetailsAPI(gameId) {
    const url = `https://api.rawg.io/api/games/${gameId}?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching game details: ${response.statusText}`);
    return await response.json();
}

/**
 * Fetches screenshots for a specific game from the RAWG API.
 * @param {string|number} gameId - The game ID or slug.
 * @returns {Promise<Object>} A promise that resolves with the screenshots data.
 */
async function fetchGameScreenshotsAPI(gameId) {
    const url = `https://api.rawg.io/api/games/${gameId}/screenshots?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching screenshots: ${response.statusText}`);
    return await response.json();
}

// --- Twitch API Functions ---

let twitchAccessToken = null;
let tokenExpiryTime = 0;

/**
 * Gets a reusable App Access Token from Twitch.
 * @returns {Promise<string>} A promise that resolves with the access token.
 */
async function getTwitchAccessToken() {
    if (twitchAccessToken && Date.now() < tokenExpiryTime) {
        return twitchAccessToken;
    }

    const tokenUrl = `https://id.twitch.tv/oauth2/token`;
    const body = new URLSearchParams({
        'client_id': twitchClientId,
        'client_secret': twitchClientSecret,
        'grant_type': 'client_credentials'
    });

    const response = await fetch(tokenUrl, { method: 'POST', body });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Could not authenticate with Twitch: ${errorData.message}`);
    }

    const data = await response.json();
    twitchAccessToken = data.access_token;
    tokenExpiryTime = Date.now() + (data.expires_in - 300) * 1000;
    return twitchAccessToken;
}

/**
 * Fetches game IDs from Twitch based on game names.
 * @param {string[]} gameNames - An array of game names.
 * @returns {Promise<string[]>} A promise that resolves with an array of Twitch game IDs.
 */
async function getTwitchGameIds(gameNames) {
    if (gameNames.length === 0) return [];
    
    const accessToken = await getTwitchAccessToken();
    const url = new URL('https://api.twitch.tv/helix/games');
    gameNames.forEach(name => url.searchParams.append('name', name));

    const response = await fetch(url, {
        headers: {
            'Client-ID': twitchClientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch game IDs from Twitch.');
    const { data } = await response.json();
    return data.map(game => game.id);
}

/**
 * Fetches live streams for a given list of Twitch Game IDs.
 * @param {string[]} gameIds - An array of Twitch game IDs.
 * @returns {Promise<Object>} A promise that resolves with the live stream data.
 */
async function fetchStreamsByGameIds(gameIds) {
    if (gameIds.length === 0) return { data: [] };

    const accessToken = await getTwitchAccessToken();
    const url = new URL('https://api.twitch.tv/helix/streams');
    gameIds.forEach(id => url.searchParams.append('game_id', id));
    url.searchParams.append('language', 'en'); // Fetching English streams
    url.searchParams.append('first', '20'); // Fetch up to 20 streams total

    const response = await fetch(url, {
        headers: {
            'Client-ID': twitchClientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch streams from Twitch.');
    return await response.json();
}

/**
 * Fetches top live streams for the main page carousel.
 * @returns {Promise<Object>} A promise that resolves with the streamer data.
 */
async function fetchTopStreamersAPI() {
    const accessToken = await getTwitchAccessToken();
    const url = 'https://api.twitch.tv/helix/streams?language=en&first=10';
    const response = await fetch(url, {
        headers: {
            'Client-ID': twitchClientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) throw new Error(`Error fetching top streams: ${response.statusText}`);
    return await response.json();
}

/**
 * High-level function to get streams for a list of game names.
 * @param {string[]} gameNames - An array of game names from the collection.
 * @returns {Promise<Object>} A promise that resolves with the live stream data.
 */
export async function fetchStreamsForGamesAPI(gameNames) {
    const gameIds = await getTwitchGameIds(gameNames);
    return await fetchStreamsByGameIds(gameIds);
}


export { fetchGamesAPI, fetchGameDetailsAPI, fetchGameScreenshotsAPI, fetchTopStreamersAPI };
