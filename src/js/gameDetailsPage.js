// src/js/gameDetailsPage.js
import { fetchGameDetailsAPI, fetchGameScreenshotsAPI } from './apiService.js';

// --- DOM Elements ---
const gameDetailsContainer = document.getElementById('gameDetailsContainer');
const detailsLoading = document.getElementById('detailsLoading');
const gameContent = document.getElementById('gameContent');

const gameTitle = document.getElementById('gameTitle');
const gameReleaseDate = document.getElementById('gameReleaseDate');
const gameMainImage = document.getElementById('gameMainImage');
const gameMetacritic = document.getElementById('gameMetacritic');
const gamePlatforms = document.getElementById('gamePlatforms');
const gameGenres = document.getElementById('gameGenres');
const gameDescription = document.getElementById('gameDescription');

const screenshotsSection = document.getElementById('screenshotsSection');
const screenshotsCarouselContainer = document.getElementById('screenshotsCarouselContainer');
const screenshotsCarousel = document.getElementById('screenshotsCarousel');
const prevScreenshotBtn = document.getElementById('prevScreenshot');
const nextScreenshotBtn = document.getElementById('nextScreenshot');
const carouselIndicators = document.getElementById('carouselIndicators');
const noScreenshotsMessage = document.getElementById('noScreenshotsMessage');

let currentScreenshotIndex = 0;
let screenshotItems = [];

// --- Helper Functions ---
/**
 * Retrieves the 'gameId' query parameter from the current URL.
 * @returns {string|null} The game ID or null if not found.
 */
function getGameIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('gameId');
}

/**
 * Formats a date string into a more readable format (e.g., "January 1, 2023").
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string or "Date not available".
 */
function formatDate(dateString) {
    if (!dateString) return 'Date not available';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// --- Populate Page with Game Data ---
/**
 * Populates the page with the fetched game details.
 * @param {Object|null} details - The game details object from the API, or null if an error occurred.
 */
function displayGameDetails(details) {
    if (!details) {
        console.error("displayGameDetails: Game details data is null or undefined.");
        return; 
    }

    console.log("displayGameDetails: Displaying details for:", details.name);

    if(gameTitle) gameTitle.textContent = details.name || 'Title Not Available';
    if(gameReleaseDate) gameReleaseDate.textContent = `Released: ${formatDate(details.released)}`;
    
    if(gameMainImage) {
        gameMainImage.src = details.background_image || 'https://placehold.co/600x800/1f1f1f/e0e0e0?text=No+Image';
        gameMainImage.alt = `Main image of ${details.name || 'game'}`;
        gameMainImage.onerror = () => { gameMainImage.src = 'https://placehold.co/600x800/1f1f1f/e0e0e0?text=Image+Error'; };
    }

    if (gameMetacritic) {
        if (details.metacritic) {
            const scoreColor = details.metacritic >= 75 ? 'bg-green-500' : details.metacritic >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            gameMetacritic.innerHTML = `
                <span class="inline-block text-white text-2xl font-bold px-4 py-2 rounded-lg ${scoreColor}">
                    ${details.metacritic}
                </span>
                <p class="text-sm text-gray-400 mt-1">Metacritic Score</p>
            `;
        } else {
            gameMetacritic.innerHTML = '<p class="text-gray-400">Metacritic: N/A</p>';
        }
    }

    if (gamePlatforms) {
        gamePlatforms.innerHTML = '<h3 class="text-xl font-semibold text-indigo-300 mb-2">Platforms</h3>';
        if (details.platforms && details.platforms.length > 0) {
            const platformsContainer = document.createElement('div');
            platformsContainer.className = 'flex flex-wrap gap-2 justify-center';
            details.platforms.forEach(p => {
                const platformTag = document.createElement('span');
                platformTag.className = 'platform-tag rounded-md'; // Using existing class from index.css
                platformTag.textContent = p.platform.name;
                platformsContainer.appendChild(platformTag);
            });
            gamePlatforms.appendChild(platformsContainer);
        } else {
            gamePlatforms.innerHTML += '<p class="text-gray-500">Not available</p>';
        }
    }
    
    if (gameGenres) {
        gameGenres.innerHTML = '<h3 class="text-xl font-semibold text-indigo-300 mb-2">Genres</h3>';
        if (details.genres && details.genres.length > 0) {
            const genresContainer = document.createElement('div');
            genresContainer.className = 'flex flex-wrap gap-2 justify-center';
            details.genres.forEach(g => {
                const genreTag = document.createElement('span');
                genreTag.className = 'genre-tag rounded-md'; // Using existing class from index.css
                genreTag.textContent = g.name;
                genresContainer.appendChild(genreTag);
            });
            gameGenres.appendChild(genresContainer);
        } else {
            gameGenres.innerHTML += '<p class="text-gray-500">Not available</p>';
        }
    }

    if (gameDescription) {
        const tempDiv = document.createElement('div');
        // Use description_raw for plain text, or description for HTML content from API
        tempDiv.innerHTML = details.description_raw || details.description || '<p>Description not available.</p>';
        // If using description_raw, replace newlines with <br> for better formatting
        gameDescription.innerHTML = details.description_raw ? tempDiv.textContent.replace(/\n/g, '<br>') : tempDiv.innerHTML;
    }
}

// --- Screenshots Carousel Logic ---
/**
 * Sets up the image carousel for game screenshots.
 * @param {Array<Object>} screenshots - An array of screenshot objects from the API.
 */
function setupScreenshotsCarousel(screenshots) {
    console.log("setupScreenshotsCarousel: Received screenshots:", screenshots);
    if (!screenshots || screenshots.length === 0) {
        console.log("setupScreenshotsCarousel: No screenshots to display.");
        if(screenshotsCarouselContainer) screenshotsCarouselContainer.classList.add('hidden');
        if(noScreenshotsMessage) {
            noScreenshotsMessage.textContent = 'No screenshots available.';
            noScreenshotsMessage.classList.remove('hidden');
        }
        return;
    }
    
    if(screenshotsCarouselContainer) screenshotsCarouselContainer.classList.remove('hidden');
    if(noScreenshotsMessage) noScreenshotsMessage.classList.add('hidden');
    if(screenshotsCarousel) screenshotsCarousel.innerHTML = ''; 
    if(carouselIndicators) carouselIndicators.innerHTML = '';

    screenshotItems = screenshots.map((ss, index) => {
        const item = document.createElement('div');
        item.className = 'carousel-item flex-shrink-0 w-full'; // Tailwind class for flex item
        const placeholderCarousel = 'https://placehold.co/800x450/1a1a1a/e0e0e0?text=Screenshot+Error';
        item.innerHTML = `<img src="${ss.image}" alt="Screenshot ${index + 1}" class="w-full h-auto object-contain max-h-[500px] rounded-md" onerror="this.onerror=null; this.src='${placeholderCarousel}';">`;
        if(screenshotsCarousel) screenshotsCarousel.appendChild(item);

        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator'; // CSS will style this
        indicator.dataset.index = index;
        if(carouselIndicators) carouselIndicators.appendChild(indicator);
        return item;
    });

    updateCarousel(); // Initial setup of carousel display

    // Event listeners for carousel navigation
    if(prevScreenshotBtn) prevScreenshotBtn.addEventListener('click', () => {
        currentScreenshotIndex = (currentScreenshotIndex - 1 + screenshotItems.length) % screenshotItems.length;
        updateCarousel();
    });

    if(nextScreenshotBtn) nextScreenshotBtn.addEventListener('click', () => {
        currentScreenshotIndex = (currentScreenshotIndex + 1) % screenshotItems.length;
        updateCarousel();
    });
    
    if(carouselIndicators) carouselIndicators.addEventListener('click', (event) => {
        if (event.target.matches('.carousel-indicator')) { // Event delegation
            currentScreenshotIndex = parseInt(event.target.dataset.index);
            updateCarousel();
        }
    });
}

/**
 * Updates the carousel display to show the current screenshot and active indicator.
 */
function updateCarousel() {
    if (screenshotItems.length === 0 || !screenshotsCarousel) return;
    // Move the carousel strip
    screenshotsCarousel.style.transform = `translateX(-${currentScreenshotIndex * 100}%)`;
    
    // Update indicators
    if(carouselIndicators) {
        const indicators = carouselIndicators.querySelectorAll('.carousel-indicator');
        indicators.forEach((indicator, index) => {
            if (index === currentScreenshotIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    // Hide/show prev/next buttons and indicators if only one image or no images
    const hasMultipleImages = screenshotItems.length > 1;
    if(prevScreenshotBtn) prevScreenshotBtn.classList.toggle('hidden', !hasMultipleImages);
    if(nextScreenshotBtn) nextScreenshotBtn.classList.toggle('hidden', !hasMultipleImages);
    if(carouselIndicators) carouselIndicators.classList.toggle('hidden', !hasMultipleImages);
}


// --- Initialization ---
/**
 * Initializes the game details page: fetches and displays game data.
 */
async function initializePage() {
    const gameId = getGameIdFromUrl();
    console.log("initializePage: Game ID from URL:", gameId);

    if (!gameId) {
        console.error("initializePage: Game ID not found in URL.");
        if(detailsLoading) detailsLoading.classList.add('hidden');
        if(gameContent) {
            gameContent.innerHTML = '<p class="text-center text-red-400 text-xl">Game ID not found in URL.</p>';
            gameContent.classList.remove('hidden');
        }
        return;
    }

    // Show loading spinner and hide content initially
    if(detailsLoading) {
        const loadingText = detailsLoading.querySelector('p');
        if(loadingText) loadingText.textContent = 'Loading game details...';
        detailsLoading.classList.remove('hidden');
    }
    if(gameContent) gameContent.classList.add('hidden');

    let gameDetailsData; // To store game details even if screenshots fail

    try {
        console.log(`initializePage: Fetching details for game ID: ${gameId}`);
        gameDetailsData = await fetchGameDetailsAPI(gameId); 
        console.log("initializePage: Game details received:", gameDetailsData);
        
        if (gameDetailsData) { 
            displayGameDetails(gameDetailsData); // Display main details
        } else {
            // This case should ideally be caught by fetchGameDetailsAPI throwing an error
            throw new Error("Game details data was not returned by the API.");
        }

        console.log(`initializePage: Fetching screenshots for game ID: ${gameId}`);
        const screenshotsData = await fetchGameScreenshotsAPI(gameId);
        console.log("initializePage: Screenshots received:", screenshotsData);
        
        if (screenshotsData && screenshotsData.results) {
            setupScreenshotsCarousel(screenshotsData.results);
        } else {
            console.warn("initializePage: No screenshot results found or unexpected data structure.");
            setupScreenshotsCarousel([]); // Set up with empty array to show "no screenshots" message
        }

        // Hide loading and show content only after all data is processed (or attempted)
        if(detailsLoading) detailsLoading.classList.add('hidden');
        if(gameContent) gameContent.classList.remove('hidden');

    } catch (error) {
        console.error("initializePage: Error loading game data:", error);
        if(detailsLoading) detailsLoading.classList.add('hidden');
        if(gameContent) {
            // If we managed to get gameDetailsData, display it even if screenshots failed
            if (gameDetailsData) {
                 displayGameDetails(gameDetailsData); 
                 // Add a message about potential missing data
                 const errorDisplay = document.createElement('p');
                 errorDisplay.className = 'text-center text-yellow-400 text-lg mt-4';
                 errorDisplay.textContent = `Some data might not have loaded (e.g., screenshots): ${error.message}`;
                 gameContent.appendChild(errorDisplay);
            } else {
                // If even gameDetailsData failed
                gameContent.innerHTML = `<p class="text-center text-red-400 text-xl">Failed to load game data: ${error.message}</p>`;
            }
            gameContent.classList.remove('hidden'); // Ensure content area is visible to show the error
        }
    }
}

// Initialize the page once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializePage);
