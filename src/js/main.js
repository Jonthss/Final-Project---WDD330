// src/js/main.js
import '../css/index.css'; // Main stylesheet
import { apiKey } from './config.js'; // API key and other configurations
import { fetchGamesAPI, fetchGameDetailsAPI, fetchTopStreamersAPI } from './apiService.js'; // API fetching functions
import {
    // UI Functions
    showLoading,
    hideLoading,
    updateSectionTitle,
    clearGamesGrid,
    clearPaginationControls,
    displayGamesOnUI,
    setupPaginationUI,
    displayGameDetailsInModal,
    setupHamburgerMenu,
    setupModalEventListeners,
    showToast, // Import showToast
    displayStreamersOnUI, // For Twitch carousel
    setupStreamerCarouselControls, // For Twitch carousel
    showStreamerLoading, // For Twitch carousel
    hideStreamerLoading, // For Twitch carousel
    displayStreamersError, // For Twitch carousel
    // DOM Elements (if needed directly, though mostly managed by uiManager)
    gamesGrid, // Used for error message fallback
    searchInput,
    searchButton,
    gameModal, // Used for modal interactions
    // Modal content elements (managed by uiManager, but good to be aware of)
    modalTitle,
    modalImage,
    modalDescription,
    modalPlatforms,
    modalGenres,
    modalReleaseDate,
    modalMetacritic,
    modalRawgLink
} from './uiManager.js';

let currentPage = 1;
let currentSearchQuery = '';
const initialLoadTitle = 'Top Popular Games'; // Default title for initial load

/**
 * Loads games from the API based on page and search query, then updates the UI.
 * @param {number} page - The page number to load.
 * @param {string} searchQuery - The search term (can be empty).
 */
async function loadGamesAndUpdateUI(page, searchQuery = '') {
    currentPage = page; // Update global current page
    currentSearchQuery = searchQuery; // Update global search query

    showLoading();
    clearGamesGrid();
    clearPaginationControls();

    // Check if API key is configured
    if (!apiKey || apiKey === 'YOUR_RAWG_API_KEY_HERE') {
        updateSectionTitle('Configuration Error');
        if (gamesGrid) { // Ensure gamesGrid exists before modifying its innerHTML
            gamesGrid.innerHTML = `<p class="text-center text-red-400 col-span-full text-lg">Please set up your RAWG API key in <code>src/js/config.js</code> to fetch games.</p>`;
        }
        hideLoading();
        showToast("API Key not configured. Please check console.", 5000);
        console.error("API Key is not configured in src/js/config.js. Please obtain a key from rawg.io.");
        return;
    }
    
    // Update the section title based on whether it's a search or initial load
    if (searchQuery) {
        updateSectionTitle(`Results for: "${searchQuery}"`);
    } else {
        updateSectionTitle(initialLoadTitle);
    }

    try {
        const data = await fetchGamesAPI(page, searchQuery);
        if (data && data.results) {
            displayGamesOnUI(data.results, handleGameCardClick); // Pass games and click handler
            setupPaginationUI(data.count, page, searchQuery, loadGamesAndUpdateUI); // Setup pagination
        } else {
            // Handle cases where data or data.results might be undefined (e.g., API error not throwing)
            console.warn("No game results found or unexpected API response structure:", data);
            updateSectionTitle('No Games Found');
             if (gamesGrid) gamesGrid.innerHTML = `<p class="text-center text-gray-400 col-span-full text-lg">No games found for your criteria.</p>`;
        }
    } catch (error) {
        console.error('Failed to load and display games:', error);
        updateSectionTitle('Error Loading Games');
        if (gamesGrid) { // Ensure gamesGrid exists
            gamesGrid.innerHTML = `<p class="text-center text-red-400 col-span-full text-lg">Failed to load games. ${error.message}</p>`;
        }
        showToast(`Error loading games: ${error.message}`, 5000);
    } finally {
        hideLoading();
    }
}

/**
 * Loads top streamers from the API and updates the carousel UI.
 */
async function loadStreamersAndUpdateUI() {
    showStreamerLoading();
    try {
        const streamersData = await fetchTopStreamersAPI();
        if (streamersData && streamersData.data && streamersData.data.length > 0) {
            displayStreamersOnUI(streamersData.data);
            setupStreamerCarouselControls();
        } else {
            displayStreamersError("Não foi possível encontrar streamers no momento.");
        }
    } catch (error) {
        console.error('Failed to load and display streamers:', error);
        displayStreamersError(`Erro ao carregar streamers: ${error.message}`);
        showToast(`Error loading streamers: ${error.message}`, 5000);
    } finally {
        hideStreamerLoading();
    }
}


/**
 * Handler for when a game card is clicked. Fetches game details and displays them in a modal.
 * @param {string|number} gameId - The ID or slug of the clicked game.
 */
async function handleGameCardClick(gameId) {
    // Reset modal content to a loading state before fetching new details
    if (modalTitle) modalTitle.textContent = 'Loading...';
    if (modalImage) modalImage.src = 'https://placehold.co/600x400/1f1f1f/e0e0e0?text=Loading...';
    if (modalDescription) modalDescription.textContent = 'Loading description...';
    if (modalPlatforms) modalPlatforms.innerHTML = '';
    if (modalGenres) modalGenres.innerHTML = '';
    if (modalReleaseDate) modalReleaseDate.textContent = 'N/A';
    if (modalMetacritic) modalMetacritic.textContent = 'N/A';
    if (modalRawgLink) {
        modalRawgLink.href = '#';
        modalRawgLink.textContent = 'More Info'; // Default text before loading
    }


    if (gameModal) { // Ensure gameModal exists
        gameModal.classList.remove('hidden');
        gameModal.classList.add('flex'); // Show modal
    }
    document.body.style.overflow = 'hidden'; // Prevent background scroll

    try {
        const gameDetails = await fetchGameDetailsAPI(gameId);
        displayGameDetailsInModal(gameDetails); // Populate modal with fetched details
    } catch (error) {
        console.error('Failed to fetch or display game details in modal:', error);
        showToast(`Error fetching game details: ${error.message}`, 5000);
        displayGameDetailsInModal(null); // Display error state in modal
    }
}

/**
 * Initializes the application: sets up event listeners and loads the initial set of games.
 */
function initializeApp() {
    setupHamburgerMenu(); // Set up mobile menu toggle
    setupModalEventListeners(); // Set up modal close listeners

    // Event listener for the search button
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            if (searchInput) {
                const query = searchInput.value.trim();
                loadGamesAndUpdateUI(1, query); // Load page 1 for new search
            }
        });
    }

    // Event listener for 'Enter' key in the search input
    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                if (searchButton) searchButton.click(); // Trigger search button click
            }
        });
    }

    // Initial load of games and streamers
    loadGamesAndUpdateUI(currentPage, currentSearchQuery);
    loadStreamersAndUpdateUI();
}

// Wait for the DOM to be fully loaded before initializing the app
document.addEventListener('DOMContentLoaded', initializeApp);
