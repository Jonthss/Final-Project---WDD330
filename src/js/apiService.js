// src/js/apiService.js
import { apiKey, pageSize } from './config.js';
import { twitchClientId, twitchClientSecret } from './config.js';

// --- RAWG API Functions ---

/**
 * Fetches games from the RAWG API.
 * @param {number} page - The page number to fetch. Defaults to 1.
 * @param {string} searchQuery - The search term (optional).
 * @returns {Promise<Object>} A promise that resolves with the game data.
 * @throws {Error} If the API call fails.
 */
async function fetchGamesAPI(page = 1, searchQuery = '') {
    let url = `https://api.rawg.io/api/games?key=${apiKey}&page=${page}&page_size=${pageSize}`;
    if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}&search_precise=true`;
    } else {
        url += `&ordering=-relevance`;
    }

    console.log(`fetchGamesAPI: Fetching URL: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
            throw new Error(`Error fetching games: ${errorData.detail || response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('fetchGamesAPI: Network or other error:', error);
        throw error;
    }
}

/**
 * Fetches details of a specific game from the RAWG API.
 * @param {string|number} gameId - The game ID or slug.
 * @returns {Promise<Object>} A promise that resolves with the game details.
 * @throws {Error} If the API call fails.
 */
async function fetchGameDetailsAPI(gameId) {
    if (!apiKey || apiKey === 'YOUR_RAWG_API_KEY_HERE') {
        throw new Error("API key not configured. Please check js/config.js.");
    }
    const url = `https://api.rawg.io/api/games/${gameId}?key=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
            throw new Error(`Error fetching game details for "${gameId}": ${errorData.detail || response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`fetchGameDetailsAPI: Network or other error for gameId ${gameId}:`, error);
        throw error;
    }
}

/**
 * Fetches screenshots for a specific game from the RAWG API.
 * @param {string|number} gameId - The game ID or slug.
 * @returns {Promise<Object>} A promise that resolves with the game screenshots data.
 * @throws {Error} If the API call fails.
 */
async function fetchGameScreenshotsAPI(gameId) {
    if (!apiKey || apiKey === 'YOUR_RAWG_API_KEY_HERE') {
        throw new Error("API key not configured. Please check js/config.js.");
    }
    const url = `https://api.rawg.io/api/games/${gameId}/screenshots?key=${apiKey}`;
     try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: `HTTP error ${response.status}` }));
            throw new Error(`Error fetching screenshots for "${gameId}": ${errorData.detail || response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`fetchGameScreenshotsAPI: Network or other error for gameId ${gameId}:`, error);
        throw error;
    }
}


// --- Twitch API Functions ---

// Store the token in memory to avoid requesting it on every call
let twitchAccessToken = null;
let tokenExpiryTime = 0;

/**
 * Gets an App Access Token from Twitch.
 * This function now includes a basic in-memory cache.
 * @returns {Promise<string>} A promise that resolves with the access token.
 */
async function getTwitchAccessToken() {
    // If we have a valid, non-expired token, return it
    if (twitchAccessToken && Date.now() < tokenExpiryTime) {
        console.log("Using cached Twitch Access Token.");
        return twitchAccessToken;
    }

    console.log("Requesting new Twitch Access Token...");
    const tokenUrl = `https://id.twitch.tv/oauth2/token`;
    
    // WARNING: This is making a request from the client-side with the secret.
    // This is NOT secure and is for demonstration purposes only.
    // In a production environment, this request MUST be made from a secure server.
    const body = new URLSearchParams({
        'client_id': twitchClientId,
        'client_secret': twitchClientSecret,
        'grant_type': 'client_credentials'
    });

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('getTwitchAccessToken: Failed to get token', response.status, errorData);
            throw new Error(`Could not authenticate with Twitch: ${errorData.message}`);
        }

        const data = await response.json();
        twitchAccessToken = data.access_token;
        // Set expiry time to be slightly less than the actual expiry for safety margin
        tokenExpiryTime = Date.now() + (data.expires_in - 300) * 1000; 

        console.log("Successfully obtained new Twitch Access Token.");
        return twitchAccessToken;

    } catch (error) {
        console.error("getTwitchAccessToken: Error during token fetch:", error);
        throw error;
    }
}

/**
 * Fetches top live streams from the Twitch API.
 * @returns {Promise<Object>} A promise that resolves with the streamer data.
 */
async function fetchTopStreamersAPI() {
    try {
        const accessToken = await getTwitchAccessToken();
        // UPDATED: Changed language from 'pt' to 'en' to fetch English-speaking streamers.
        const url = 'https://api.twitch.tv/helix/streams?language=en&first=10'; // Gets top 10 English streams

        const response = await fetch(url, {
            headers: {
                'Client-ID': twitchClientId,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('fetchTopStreamersAPI: HTTP error fetching streams:', response.status, errorData);
            // If the token is unauthorized, clear it to force a refresh on next attempt
            if (response.status === 401) {
                twitchAccessToken = null;
            }
            throw new Error(`Error fetching streams: ${errorData.message || 'Twitch API error'}`);
        }
        
        return await response.json();

    } catch (error) {
        console.error('fetchTopStreamersAPI: Failed to fetch top streamers.', error);
        // We throw the error so the UI layer can handle it (e.g., show a message to the user)
        throw error;
    }
}


export { fetchGamesAPI, fetchGameDetailsAPI, fetchGameScreenshotsAPI, fetchTopStreamersAPI };
