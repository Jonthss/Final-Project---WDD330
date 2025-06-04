// src/js/collectionPage.js
import { getCollection, removeFromCollection } from './collectionManager.js';

// --- DOM Elements ---
const collectionGamesGrid = document.getElementById('collectionGamesGrid');
const emptyCollectionMessage = document.getElementById('emptyCollectionMessage');
const toastNotification = document.getElementById('toastNotification'); // For toast messages
const toastMessage = document.getElementById('toastMessage');
let toastTimeout;

// --- Toast Notification Function ---
/**
 * Displays a toast notification message.
 * @param {string} message - The message to display.
 * @param {number} duration - How long the toast stays visible (in milliseconds).
 */
function showToast(message, duration = 3000) {
    if (!toastNotification || !toastMessage) {
        console.warn("Toast elements not found in DOM for collection page.");
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

// --- Main Functions for Collection Page ---
/**
 * Displays the games currently in the user's collection.
 */
function displayCollectionGames() {
    if (!collectionGamesGrid || !emptyCollectionMessage) {
        console.warn("Collection grid or empty message element not found.");
        return;
    }

    const collection = getCollection();
    collectionGamesGrid.innerHTML = ''; // Clear existing games

    if (collection.length === 0) {
        emptyCollectionMessage.classList.remove('hidden');
        collectionGamesGrid.classList.add('hidden');
        // Ensure the message text is set if it's not hardcoded in HTML
        const emptyMessageLink = emptyCollectionMessage.querySelector('a');
        if (emptyMessageLink) {
             emptyCollectionMessage.innerHTML = `Your collection is empty. Go <a href="../../index.html#Explore" class="text-indigo-400 hover:underline">explore some games</a> to add them!`;
        } else {
            emptyCollectionMessage.textContent = 'Your collection is empty. Go explore some games to add them!';
        }

    } else {
        emptyCollectionMessage.classList.add('hidden');
        collectionGamesGrid.classList.remove('hidden');
        collection.forEach(game => {
            const gameCard = createCollectionGameCard(game);
            collectionGamesGrid.appendChild(gameCard);
        });
    }
}

/**
 * Creates the HTML structure for a single game card in the collection.
 * @param {Object} game - The game object from the stored collection.
 * @returns {HTMLElement} The created game card element.
 */
function createCollectionGameCard(game) {
    const gameCard = document.createElement('div');
    gameCard.classList.add('game-card', 'flex', 'flex-col', 'collection-item'); // 'collection-item' for specific styling if needed

    const placeholderImage = 'https://placehold.co/400x300/1f1f1f/e0e0e0?text=No+Image';
    const imageUrl = game.background_image || placeholderImage;

    const metacriticHTML = game.metacritic ?
        `<div class="text-xs text-gray-400 mb-1">Metacritic: <span class="font-semibold text-indigo-400">${game.metacritic}</span></div>` :
        '<div class="text-xs text-gray-400 mb-1">Metacritic: N/A</div>';

    // Display up to 3 platforms
    const platformsHTML = game.platforms && game.platforms.length > 0 ?
        game.platforms.slice(0, 3).map(name => `<span class="platform-tag-sm rounded-full">${name}</span>`).join(' ') :
        '<span class="text-xs text-gray-500">N/A</span>';
    
    // Display up to 2 genres
    const genresHTML = game.genres && game.genres.length > 0 ?
        game.genres.slice(0, 2).map(name => `<span class="genre-tag-sm rounded-full">${name}</span>`).join(' ') :
        '<span class="text-xs text-gray-500">N/A</span>';

    gameCard.innerHTML = `
        <div class="relative">
            <img src="${imageUrl}" alt="Image of ${game.name}" class="game-image" onerror="this.onerror=null;this.src='${placeholderImage}';">
            <button title="Remove from Collection" class="remove-from-collection-btn absolute top-3 right-3 p-2 rounded-full" data-game-id="${game.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-bookmark-x-fill" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5zM6.854 5.146a.5.5 0 1 0-.708.708L7.293 7 6.146 8.146a.5.5 0 1 0 .708.708L8 7.707l1.146 1.147a.5.5 0 1 0 .708-.708L8.707 7l1.147-1.146a.5.5 0 0 0-.708-.708L8 6.293 6.854 5.146z"/>
                </svg>
            </button>
        </div>
        <div class="p-4 flex flex-col flex-grow">
            <h3 class="text-lg font-semibold mb-2 text-white truncate" title="${game.name}">${game.name}</h3>
            <div class="text-xs text-gray-400 mb-1">
                Released: ${game.released ? new Date(game.released).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
            </div>
            ${metacriticHTML}
            <div class="my-2">
                <p class="text-xs text-gray-500 mb-1">Platforms:</p>
                <div class="flex flex-wrap gap-1 items-center">
                    ${platformsHTML}
                </div>
            </div>
            <div class="my-2">
                <p class="text-xs text-gray-500 mb-1">Genres:</p>
                <div class="flex flex-wrap gap-1 items-center">
                    ${genresHTML}
                </div>
            </div>
            <div class="mt-auto pt-2">
                 <a href="../details/game-details.html?gameId=${game.id}" target="_self" class="view-details-link inline-block text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Game Page</a>
            </div>
        </div>
    `;

    const removeButton = gameCard.querySelector('.remove-from-collection-btn');
    if (removeButton) {
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent card click event
            const gameIdToRemove = parseInt(removeButton.dataset.gameId, 10);
            removeFromCollection(gameIdToRemove);
            showToast(`"${game.name}" removed from collection.`);
            displayCollectionGames(); // Refresh the displayed collection
        });
    }
    
    // Make the card (excluding the remove button) link to the game details page
    gameCard.addEventListener('click', (event) => {
        if (!event.target.closest('.remove-from-collection-btn')) {
            // Navigate to the internal game details page
            window.location.href = `../details/game-details.html?gameId=${game.id}`;
        }
    });

    return gameCard;
}

// --- Initialization ---
/**
 * Initializes the collection page when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    displayCollectionGames();
});
