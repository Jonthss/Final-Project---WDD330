// src/js/uiManager.js
import { pageSize, excludedGameNames } from './config.js';
import { getCollection, addToCollection, removeFromCollection, isGameInCollection } from './collectionManager.js';

// --- DOM Element Selection ---
// Export elements needed by main.js or other modules
export const gamesGrid = document.getElementById('gamesGrid');
export const searchInput = document.getElementById('searchInput');
export const searchButton = document.getElementById('searchButton');
const loadingIndicator = document.getElementById('loading');
const paginationControls = document.getElementById('paginationControls');
const sectionTitle = document.getElementById('sectionTitle');

// Modal elements
export const gameModal = document.getElementById('gameModal');
const closeModalButton = document.getElementById('closeModalButton');
export const modalTitle = document.getElementById('modalTitle');
export const modalImage = document.getElementById('modalImage');
export const modalDescription = document.getElementById('modalDescription');
export const modalPlatforms = document.getElementById('modalPlatforms');
export const modalGenres = document.getElementById('modalGenres');
export const modalReleaseDate = document.getElementById('modalReleaseDate');
export const modalMetacritic = document.getElementById('modalMetacritic');
export const modalRawgLink = document.getElementById('modalRawgLink');

// Hamburger menu elements
const hamburgerButton = document.getElementById('hamburgerButton');
const mobileMenu = document.getElementById('mobileMenu');
const hamburgerIconOpen = document.getElementById('hamburgerIconOpen');
const hamburgerIconClose = document.getElementById('hamburgerIconClose');

// Toast notification elements
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');
let toastTimeout;

// Streamer Carousel Elements
const streamersCarousel = document.getElementById('streamersCarousel');
const prevStreamerBtn = document.getElementById('prevStreamerBtn');
const nextStreamerBtn = document.getElementById('nextStreamerBtn');
const streamerLoading = document.getElementById('streamerLoading');
const streamersError = document.getElementById('streamersError');
const streamersSectionTitle = document.getElementById('streamersSectionTitle');


// --- Toast Notification Functions ---
/**
 * Displays a toast notification message.
 * @param {string} message - The message to display.
 * @param {number} duration - How long the toast stays visible (in milliseconds).
 */
export function showToast(message, duration = 3000) {
    if (!toastNotification || !toastMessage) {
        console.warn("Toast elements not found in DOM.");
        return;
    }

    toastMessage.textContent = message;
    toastNotification.classList.remove('opacity-0');
    toastNotification.classList.add('opacity-100');

    clearTimeout(toastTimeout); // Clear any existing timeout
    toastTimeout = setTimeout(() => {
        toastNotification.classList.remove('opacity-100');
        toastNotification.classList.add('opacity-0');
    }, duration);
}

// --- General UI Manipulation Functions ---
export function showLoading() {
    if (loadingIndicator) loadingIndicator.style.display = 'block';
}

export function hideLoading() {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

export function updateSectionTitle(title) {
    if (sectionTitle) sectionTitle.textContent = title;
}

export function clearGamesGrid() {
    if (gamesGrid) gamesGrid.innerHTML = '';
}

export function clearPaginationControls() {
    if (paginationControls) paginationControls.innerHTML = '';
}

// --- Streamer Carousel UI Functions ---
export function showStreamerLoading() {
    if (streamerLoading) streamerLoading.style.display = 'block';
    if (streamersError) streamersError.classList.add('hidden');
    if (streamersCarousel) streamersCarousel.classList.add('hidden');
}

export function hideStreamerLoading() {
    if (streamerLoading) streamerLoading.style.display = 'none';
    if (streamersCarousel) streamersCarousel.classList.remove('hidden');
}

export function displayStreamersError(message) {
    if (streamersError) {
        streamersError.textContent = message;
        streamersError.classList.remove('hidden');
    }
    if (streamersSectionTitle) streamersSectionTitle.textContent = "Could not load streamers";
}


/**
 * Creates the HTML for a single streamer card.
 * @param {Object} streamer - The streamer object from Twitch API.
 * @returns {string} HTML string for the streamer card.
 */
function createStreamerCardHTML(streamer) {
    const thumbnailUrl = streamer.thumbnail_url
        .replace('{width}', '320')
        .replace('{height}', '180');
    
    // Format viewer count
    const viewers = streamer.viewer_count > 1000 
        ? `${(streamer.viewer_count / 1000).toFixed(1)}K` 
        : streamer.viewer_count;

    return `
        <a href="https://twitch.tv/${streamer.user_login}" target="_blank" class="streamer-card" title="Watch ${streamer.user_name} on Twitch">
            <div class="streamer-card-thumbnail relative">
                <img src="${thumbnailUrl}" alt="Thumbnail of ${streamer.user_name}'s stream" class="w-full h-auto object-cover" onerror="this.onerror=null;this.src='https://placehold.co/320x180/1f1f1f/9146ff?text=Offline';">
                <div class="live-indicator">LIVE</div>
                <div class="viewer-count">${viewers} viewers</div>
            </div>
            <div class="streamer-card-info flex items-center space-x-3">
                <div class="flex-grow">
                    <h4 class="text-white font-bold truncate">${streamer.user_name}</h4>
                    <p class="text-gray-400 text-sm truncate">${streamer.game_name}</p>
                </div>
            </div>
        </a>
    `;
}

/**
 * Displays streamers in the carousel UI.
 * @param {Array<Object>} streamers - Array of streamer objects from Twitch API.
 */
export function displayStreamersOnUI(streamers) {
    if (!streamersCarousel) return;
    streamersCarousel.innerHTML = '';

    if (!streamers || streamers.length === 0) {
        displayStreamersError("No streamers are live right now.");
        return;
    }

    streamers.forEach(streamer => {
        streamersCarousel.innerHTML += createStreamerCardHTML(streamer);
    });
}

/**
 * Sets up the event listeners and visibility for the streamer carousel controls.
 * This version scrolls by one "page" (the visible width of the carousel) at a time.
 */
export function setupStreamerCarouselControls() {
    if (!streamersCarousel || !prevStreamerBtn || !nextStreamerBtn) return;

    // Use a ResizeObserver to update button visibility when the window size changes.
    const observer = new ResizeObserver(() => {
        updateButtonVisibility();
    });

    const updateButtonVisibility = () => {
        // Amount to scroll is the visible width of the carousel.
        const scrollAmount = streamersCarousel.clientWidth;
        // The maximum distance the carousel can be scrolled.
        const maxScroll = streamersCarousel.scrollWidth - scrollAmount;
        
        // Show/hide previous button
        prevStreamerBtn.classList.toggle('hidden', streamersCarousel.scrollLeft <= 0);
        // Show/hide next button. Use a small tolerance (e.g., 5px) for precision issues.
        nextStreamerBtn.classList.toggle('hidden', streamersCarousel.scrollLeft >= maxScroll - 5);
    };

    // Check if the content is scrollable at all
    if (streamersCarousel.scrollWidth > streamersCarousel.clientWidth) {
         // Initial check
        updateButtonVisibility();
        observer.observe(streamersCarousel); // Start observing for size changes

        // Add event listeners for buttons
        prevStreamerBtn.addEventListener('click', () => {
            const scrollAmount = streamersCarousel.clientWidth;
            streamersCarousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        nextStreamerBtn.addEventListener('click', () => {
            const scrollAmount = streamersCarousel.clientWidth;
            streamersCarousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        // Update buttons after a scroll has finished
        streamersCarousel.addEventListener('scroll', updateButtonVisibility);
    } else {
        // Hide both buttons if not scrollable and stop observing.
        prevStreamerBtn.classList.add('hidden');
        nextStreamerBtn.classList.add('hidden');
        observer.unobserve(streamersCarousel);
    }
}


// --- Game Card Creation and Display (for main games list) ---
/**
 * Creates the HTML structure for a single game card.
 * @param {Object} game - The game object from the API.
 * @returns {string} HTML string for the game card.
 */
function createGameCardHTML(game) {
    const placeholderImage = 'https://placehold.co/400x300/1f1f1f/e0e0e0?text=No+Image';
    const imageUrl = game.background_image ? game.background_image : placeholderImage;

    const platformsHTML = game.platforms?.slice(0, 3).map(p =>
        `<span class="platform-tag rounded-full">${p.platform.name}</span>`
    ).join(' ') || '<span class="text-xs text-gray-500">N/A</span>';

    const metacriticScoreHTML = game.metacritic ?
        `<span class="absolute top-3 left-3 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">MC: ${game.metacritic}</span>` :
        '';

    const isInCollection = isGameInCollection(game.id);
    const buttonIcon = isInCollection ?
        `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-bookmark-check-fill" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5zm8.854-9.646a.5.5 0 0 0-.708-.708L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"/>
        </svg>` :
        `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-bookmark-plus" viewBox="0 0 16 16">
            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
            <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4z"/>
        </svg>`;
    const buttonTitle = isInCollection ? "Remove from Collection" : "Add to Collection";
    const buttonClass = isInCollection ? "in-collection" : ""; // Class to style if in collection

    return `
        <div class="relative">
            <img src="${imageUrl}" alt="Image of ${game.name}" class="game-image" onerror="this.onerror=null;this.src='${placeholderImage}';">
            ${metacriticScoreHTML}
            <button title="${buttonTitle}" class="add-to-collection-btn ${buttonClass} absolute top-3 right-3 p-2 rounded-full" data-game-id="${game.id}">
                ${buttonIcon}
            </button>
        </div>
        <div class="p-4 flex flex-col flex-grow">
            <h3 class="text-lg font-semibold mb-2 text-white truncate" title="${game.name}">${game.name}</h3>
            <div class="text-xs text-gray-400 mb-1">
                Released: ${game.released ? new Date(game.released).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
            </div>
            <div class="text-xs text-gray-400 mb-3">
                RAWG Rating: ${game.rating ? `${game.rating.toFixed(1)} / 5` : 'N/A'}
            </div>
            <div class="mt-auto flex flex-wrap gap-1 items-center">
                ${platformsHTML}
            </div>
        </div>
    `;
}

/**
 * Displays games on the UI by creating and appending game cards.
 * @param {Array<Object>} games - Array of game objects from the API.
 * @param {Function} onGameCardClickHandler - Callback function for when a game card (not the collection button) is clicked.
 */
export function displayGamesOnUI(games, onGameCardClickHandler) {
    if (!gamesGrid) return;
    clearGamesGrid();

    const gamesToDisplay = games.filter(game => {
        if (excludedGameNames && Array.isArray(excludedGameNames)) {
            const gameNameLowerTrimmed = game.name.toLowerCase().trim();
            return !excludedGameNames.some(excludedName =>
                excludedName.toLowerCase().trim() === gameNameLowerTrimmed
            );
        }
        return true; // Include game if no exclusion criteria match
    });

    if (!gamesToDisplay || gamesToDisplay.length === 0) {
        gamesGrid.innerHTML = `<p class="text-center text-gray-400 col-span-full text-lg">No games found matching the current criteria.</p>`;
        return;
    }

    gamesToDisplay.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.classList.add('game-card', 'flex', 'flex-col');
        gameCard.innerHTML = createGameCardHTML(game); // Pass the full game object

        // Event listener for opening the modal (on the card itself, excluding the collection button)
        gameCard.addEventListener('click', (event) => {
            if (!event.target.closest('.add-to-collection-btn')) { // Only open modal if not clicking the collection button
                onGameCardClickHandler(game.id);
            }
        });
        
        // Event listener for the add/remove to collection button
        const collectionButton = gameCard.querySelector('.add-to-collection-btn');
        if (collectionButton) {
            collectionButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent modal from opening due to event bubbling
                handleCollectionButtonClick(collectionButton, game); // Pass the full game object
            });
        }
        gamesGrid.appendChild(gameCard);
    });
}

/**
 * Handles the click event for the "Add to Collection" / "Remove from Collection" button.
 * @param {HTMLElement} button - The button element that was clicked.
 * @param {Object} gameData - The full game object associated with the card.
 */
function handleCollectionButtonClick(button, gameData) {
    // Prepare the object to be stored, ensuring all necessary fields are present
    const gameToStore = {
        id: gameData.id,
        name: gameData.name,
        background_image: gameData.background_image || '',
        released: gameData.released || '',
        metacritic: gameData.metacritic || null,
        platforms: gameData.platforms?.map(p => p.platform.name) || [], 
        genres: gameData.genres?.map(g => g.name) || [], 
        slug: gameData.slug || String(gameData.id) // Ensure slug is a string, fallback to ID
    };
    
    if (isGameInCollection(gameToStore.id)) {
        removeFromCollection(gameToStore.id);
        showToast(`"${gameToStore.name}" removed from collection.`);
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-bookmark-plus" viewBox="0 0 16 16">
                                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
                                <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4z"/>
                            </svg>`;
        button.title = "Add to Collection";
        button.classList.remove("in-collection");
    } else {
        addToCollection(gameToStore);
        showToast(`"${gameToStore.name}" added to collection!`);
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-bookmark-check-fill" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5zm8.854-9.646a.5.5 0 0 0-.708-.708L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"/>
                            </svg>`;
        button.title = "Remove from Collection";
        button.classList.add("in-collection");
    }
}


// --- Modal Display Functions ---
/**
 * Displays game details in the modal.
 * @param {Object|null} gameDetails - The detailed game object from API, or null if an error occurred.
 */
export function displayGameDetailsInModal(gameDetails) {
    if (!gameModal || !modalTitle || !modalImage || !modalDescription || !modalPlatforms || !modalGenres || !modalReleaseDate || !modalMetacritic || !modalRawgLink) {
        console.warn("One or more modal elements were not found in the DOM. Cannot display game details in modal.");
        return;
    }

    if (gameDetails) {
        modalTitle.textContent = gameDetails.name || "Game Details";
        modalImage.src = gameDetails.background_image || 'https://placehold.co/600x400/1f1f1f/e0e0e0?text=No+Image';
        modalImage.alt = `Image of ${gameDetails.name || 'game'}`;
        modalImage.onerror = () => { modalImage.src = 'https://placehold.co/600x400/1f1f1f/e0e0e0?text=Image+Error'; };

        const descriptionContainer = document.createElement('div');
        descriptionContainer.innerHTML = gameDetails.description_raw || gameDetails.description || 'Description not available.';
        modalDescription.textContent = descriptionContainer.textContent.substring(0, 800) + (descriptionContainer.textContent.length > 800 ? '...' : '');

        modalPlatforms.innerHTML = gameDetails.platforms?.map(p => `<span class="platform-tag rounded-md">${p.platform.name}</span>`).join(' ') || '<span class="text-gray-500">Not informed</span>';
        modalGenres.innerHTML = gameDetails.genres?.map(g => `<span class="genre-tag rounded-md">${g.name}</span>`).join(' ') || '<span class="text-gray-500">Not informed</span>';
        modalReleaseDate.textContent = gameDetails.released ? new Date(gameDetails.released).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not informed';
        modalMetacritic.textContent = gameDetails.metacritic || 'N/A';
        
        // Link to the internal game details page
        modalRawgLink.href = `src/details/game-details.html?gameId=${gameDetails.id}`;
        modalRawgLink.target = "_self"; // Open in the same tab
        modalRawgLink.textContent = "View Game Page"; // Updated link text

    } else {
        // Handle case where gameDetails is null (e.g., API error)
        modalTitle.textContent = 'Error Loading Details';
        modalImage.src = 'https://placehold.co/600x400/1f1f1f/e0e0e0?text=Error';
        modalImage.alt = 'Error loading image';
        modalDescription.textContent = 'Could not load the details for this game. Please try again later.';
        modalPlatforms.innerHTML = '';
        modalGenres.innerHTML = '';
        modalReleaseDate.textContent = 'N/A';
        modalMetacritic.textContent = 'N/A';
        modalRawgLink.href = '#'; // Default link in case of error
        modalRawgLink.textContent = "More Info"; // Default text
        modalRawgLink.target = "_blank"; // Default behavior in case of error
    }
    gameModal.classList.remove('hidden');
    gameModal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling when modal is open
}

/**
 * Closes the game details modal.
 */
function closeModalUI() {
    if (gameModal) {
        gameModal.classList.add('hidden');
        gameModal.classList.remove('flex');
        document.body.style.overflow = 'auto'; // Restore background scrolling
    }
}

// --- Pagination UI ---
/**
 * Creates a single pagination button element.
 * @param {string} text - Text content for the button (e.g., page number, "Next").
 * @param {number} pageNumber - The page number this button links to.
 * @param {string} searchQuery - The current search query, to maintain search state.
 * @param {boolean} isActive - Whether this button represents the current page.
 * @param {Function} onPageClickCallback - Callback function for when the button is clicked.
 * @returns {HTMLButtonElement} The created button element.
 */
function createPaginationButtonElement(text, pageNumber, searchQuery, isActive, onPageClickCallback) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('pagination-button', 'px-3', 'sm:px-4', 'py-2', 'rounded-md', 'font-medium', 'text-sm', 'transition-colors');
    if (isActive) {
        button.classList.add('active', 'cursor-default'); // Style for active page
        button.disabled = true;
    } else {
        button.addEventListener('click', () => {
            onPageClickCallback(pageNumber, searchQuery); // Call the main load function
            // Scroll to the top of the games section after page change
            const exploreSection = document.getElementById('Explore');
            if (exploreSection) {
                window.scrollTo({ top: exploreSection.offsetTop - 70, behavior: 'smooth' }); // Adjust offset if navbar is sticky
            } else {
                 window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    return button;
}

/**
 * Sets up the pagination controls based on total items and current page.
 * @param {number} totalItems - Total number of games available for the current query.
 * @param {number} currentPage - The currently displayed page number.
 * @param {string} searchQuery - The current search query.
 * @param {Function} onPageClickCallback - Function to call when a page button is clicked.
 */
export function setupPaginationUI(totalItems, currentPage, searchQuery, onPageClickCallback) {
    if (!paginationControls) return;
    clearPaginationControls();
    const itemsPerPage = pageSize || 20; // Default to 20 if pageSize is not set
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return; // No pagination needed for a single page

    const maxVisibleButtons = 5; // Max number of page number buttons to show (e.g., 1 ... 3 4 5 ... 10)
    let startPage, endPage;

    if (totalPages <= maxVisibleButtons) {
        // Less than or equal to max buttons: show all
        startPage = 1;
        endPage = totalPages;
    } else {
        // More than max buttons: calculate start and end pages
        let maxPagesBeforeCurrentPage = Math.floor(maxVisibleButtons / 2);
        let maxPagesAfterCurrentPage = Math.ceil(maxVisibleButtons / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrentPage) {
            // Near the start
            startPage = 1;
            endPage = maxVisibleButtons;
        } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
            // Near the end
            startPage = totalPages - maxVisibleButtons + 1;
            endPage = totalPages;
        } else {
            // In the middle
            startPage = currentPage - maxPagesBeforeCurrentPage;
            endPage = currentPage + maxPagesAfterCurrentPage;
        }
    }

    // "Previous" button
    if (currentPage > 1) {
        paginationControls.appendChild(createPaginationButtonElement('Previous', currentPage - 1, searchQuery, false, onPageClickCallback));
    }

    // First page and ellipsis "..." if needed
    if (startPage > 1) {
        paginationControls.appendChild(createPaginationButtonElement('1', 1, searchQuery, false, onPageClickCallback));
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.classList.add('px-2', 'py-2', 'text-gray-400');
            dots.textContent = '...';
            paginationControls.appendChild(dots);
        }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        paginationControls.appendChild(createPaginationButtonElement(String(i), i, searchQuery, i === currentPage, onPageClickCallback));
    }

    // Last page and ellipsis "..." if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.classList.add('px-2', 'py-2', 'text-gray-400');
            dots.textContent = '...';
            paginationControls.appendChild(dots);
        }
        paginationControls.appendChild(createPaginationButtonElement(String(totalPages), totalPages, searchQuery, false, onPageClickCallback));
    }

    // "Next" button
    if (currentPage < totalPages) {
        paginationControls.appendChild(createPaginationButtonElement('Next', currentPage + 1, searchQuery, false, onPageClickCallback));
    }
}

// --- Event Listener Setup ---
/**
 * Sets up the event listener for the hamburger menu toggle.
 */
export function setupHamburgerMenu() {
    if (hamburgerButton && mobileMenu && hamburgerIconOpen && hamburgerIconClose) {
        hamburgerButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            hamburgerIconOpen.classList.toggle('hidden'); // Toggle open icon
            hamburgerIconClose.classList.toggle('hidden'); // Toggle close icon
        });
    } else {
        console.warn("Hamburger menu elements not found in DOM. Menu will not function.");
    }
}

/**
 * Sets up event listeners for the game details modal (close button, escape key, outside click).
 */
export function setupModalEventListeners() {
    if (closeModalButton && gameModal) {
        closeModalButton.addEventListener('click', closeModalUI);
        // Close modal if clicked outside of modal-content
        gameModal.addEventListener('click', (event) => {
            if (event.target === gameModal) { // Check if the click is on the modal backdrop itself
                closeModalUI();
            }
        });
        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && gameModal && !gameModal.classList.contains('hidden')) {
                closeModalUI();
            }
        });
    } else {
        console.warn("Modal elements for event listeners not found in DOM. Modal may not close as expected.");
    }
}
