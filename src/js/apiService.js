// src/js/apiService.js
import { apiKey, pageSize } from './config.js';

/**
 * Fetches games from the RAWG API.
 * @param {number} page - The page number to fetch. Defaults to 1.
 * @param {string} searchQuery - The search term (optional).
 * @returns {Promise<Object>} A promise that resolves with the game data (e.g., { results: [], count: 0 }).
 * @throws {Error} If the API call fails.
 */
async function fetchGamesAPI(page = 1, searchQuery = '') {
    let url = `https://api.rawg.io/api/games?key=${apiKey}&page=${page}&page_size=${pageSize}`;
    if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}&search_precise=true`;
    } else {
        // Default ordering if no search query (e.g., by relevance, rating, or Metacritic score)
        url += `&ordering=-relevance`; // Options: -rating, -metacritic, -released
    }

    console.log(`fetchGamesAPI: Fetching URL: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorData = { detail: `HTTP error ${response.status}` }; // Default error object
            try {
                errorData = await response.json(); // Try to parse API's error response
            } catch (e) {
                // If parsing fails, log it but use the default errorData or response.statusText
                console.warn("fetchGamesAPI: Could not parse API error JSON. Status:", response.status);
            }
            console.error('fetchGamesAPI: HTTP error fetching games:', response.status, errorData);
            throw new Error(`Error fetching games: ${errorData.detail || response.statusText || 'Unknown API error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('fetchGamesAPI: Network or other error:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

/**
 * Fetches details of a specific game from the RAWG API.
 * @param {string|number} gameId - The game ID or slug.
 * @returns {Promise<Object>} A promise that resolves with the game details.
 * @throws {Error} If the API call fails or the API key is not configured.
 */
async function fetchGameDetailsAPI(gameId) {
    if (!apiKey || apiKey === 'YOUR_RAWG_API_KEY_HERE') { // Check if API key is placeholder or empty
        const errorMsg = "API key not configured. Please check js/config.js.";
        console.error(`fetchGameDetailsAPI: ${errorMsg}`);
        throw new Error(errorMsg);
    }
    const url = `https://api.rawg.io/api/games/${gameId}?key=${apiKey}`;
    console.log(`fetchGameDetailsAPI: Fetching URL: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorData = { detail: `HTTP error ${response.status}` };
            try {
                errorData = await response.json();
            } catch (e) {
                console.warn(`fetchGameDetailsAPI: Could not parse API error JSON for gameId ${gameId}. Status:`, response.status);
            }
            console.error('fetchGameDetailsAPI: HTTP error fetching game details:', response.status, errorData);
            throw new Error(`Error fetching game details for "${gameId}": ${errorData.detail || response.statusText || 'Unknown API error'}`);
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
 * @returns {Promise<Object>} A promise that resolves with the game screenshots data (e.g., { results: [] }).
 * @throws {Error} If the API call fails or the API key is not configured.
 */
async function fetchGameScreenshotsAPI(gameId) {
    if (!apiKey || apiKey === 'YOUR_RAWG_API_KEY_HERE') {
        const errorMsg = "API key not configured. Please check js/config.js.";
        console.error(`fetchGameScreenshotsAPI: ${errorMsg}`);
        throw new Error(errorMsg);
    }
    const url = `https://api.rawg.io/api/games/${gameId}/screenshots?key=${apiKey}`;
    console.log(`fetchGameScreenshotsAPI: Fetching URL: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorData = { detail: `HTTP error ${response.status}` };
            try {
                errorData = await response.json();
            } catch (e) {
                console.warn(`fetchGameScreenshotsAPI: Could not parse API error JSON for gameId ${gameId}. Status:`, response.status);
            }
            console.error('fetchGameScreenshotsAPI: HTTP error fetching screenshots:', response.status, errorData);
            throw new Error(`Error fetching screenshots for "${gameId}": ${errorData.detail || response.statusText || 'Unknown API error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`fetchGameScreenshotsAPI: Network or other error for gameId ${gameId}:`, error);
        throw error;
    }
}

export { fetchGamesAPI, fetchGameDetailsAPI, fetchGameScreenshotsAPI };
