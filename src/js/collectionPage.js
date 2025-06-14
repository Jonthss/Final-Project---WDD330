// src/js/collectionPage.js
import { getCollection, removeFromCollection } from './collectionManager.js';
import { fetchStreamsForGamesAPI } from './apiService.js';

// --- DOM Elements ---
const collectionGamesGrid = document.getElementById('collectionGamesGrid');
const emptyCollectionMessage = document.getElementById('emptyCollectionMessage');
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');
let toastTimeout;

// --- Streamer Section DOM Elements ---
const liveStreamsSection = document.getElementById('liveStreamsSection');
const streamersCarousel = document.getElementById('streamersCarousel');
const prevStreamerBtn = document.getElementById('prevStreamerBtn');
const nextStreamerBtn = document.getElementById('nextStreamerBtn');
const streamerLoading = document.getElementById('streamerLoading');
const streamersError = document.getElementById('streamersError');

// --- Toast Notification ---
function showToast(message, duration = 3000) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = message;
    toastNotification.classList.remove('opacity-0');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastNotification.classList.add('opacity-0'), duration);
}

// --- Streamer Carousel Functions ---

function createStreamerCardHTML(streamer) {
    const thumbnailUrl = streamer.thumbnail_url.replace('{width}', '320').replace('{height}', '180');
    const viewers = streamer.viewer_count > 1000 ? `${(streamer.viewer_count / 1000).toFixed(1)}K` : streamer.viewer_count;
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

function setupStreamerCarouselControls() {
    if (!streamersCarousel || !prevStreamerBtn || !nextStreamerBtn) return;
    const observer = new ResizeObserver(updateButtonVisibility);

    function updateButtonVisibility() {
        const scrollAmount = streamersCarousel.clientWidth;
        const maxScroll = streamersCarousel.scrollWidth - scrollAmount;
        prevStreamerBtn.classList.toggle('hidden', streamersCarousel.scrollLeft <= 0);
        nextStreamerBtn.classList.toggle('hidden', streamersCarousel.scrollLeft >= maxScroll - 5);
    }

    if (streamersCarousel.scrollWidth > streamersCarousel.clientWidth) {
        updateButtonVisibility();
        observer.observe(streamersCarousel);
        prevStreamerBtn.onclick = () => streamersCarousel.scrollBy({ left: -streamersCarousel.clientWidth, behavior: 'smooth' });
        nextStreamerBtn.onclick = () => streamersCarousel.scrollBy({ left: streamersCarousel.clientWidth, behavior: 'smooth' });
        streamersCarousel.onscroll = updateButtonVisibility;
    } else {
        prevStreamerBtn.classList.add('hidden');
        nextStreamerBtn.classList.add('hidden');
        observer.disconnect();
    }
}

async function loadLiveStreamsForCollection(collection) {
    if (collection.length === 0 || !liveStreamsSection) return;

    liveStreamsSection.classList.remove('hidden');
    streamerLoading.style.display = 'block';
    streamersError.classList.add('hidden');

    try {
        const gameNames = collection.map(game => game.name);
        const streamsData = await fetchStreamsForGamesAPI(gameNames);

        if (streamsData.data && streamsData.data.length > 0) {
            streamersCarousel.innerHTML = streamsData.data.map(createStreamerCardHTML).join('');
            setupStreamerCarouselControls();
        } else {
            streamersError.textContent = "No live streams found for your favorite games right now.";
            streamersError.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Failed to load live streams for collection:", error);
        streamersError.textContent = "Could not load live streams. Please try again later.";
        streamersError.classList.remove('hidden');
    } finally {
        streamerLoading.style.display = 'none';
    }
}

// --- Collection Games Functions ---

function createCollectionGameCard(game) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card flex flex-col collection-item';
    const placeholderImage = 'https://placehold.co/400x300/1f1f1f/e0e0e0?text=No+Image';
    const imageUrl = game.background_image || placeholderImage;
    const metacriticHTML = game.metacritic ? `<div class="text-xs text-gray-400 mb-1">Metacritic: <span class="font-semibold text-indigo-400">${game.metacritic}</span></div>` : '<div class="text-xs text-gray-400 mb-1">Metacritic: N/A</div>';
    const platformsHTML = game.platforms?.slice(0, 3).map(name => `<span class="platform-tag-sm rounded-full">${name}</span>`).join(' ') || '<span class="text-xs text-gray-500">N/A</span>';
    const genresHTML = game.genres?.slice(0, 2).map(name => `<span class="genre-tag-sm rounded-full">${name}</span>`).join(' ') || '<span class="text-xs text-gray-500">N/A</span>';

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
            <div class="my-2"><p class="text-xs text-gray-500 mb-1">Platforms:</p><div class="flex flex-wrap gap-1 items-center">${platformsHTML}</div></div>
            <div class="my-2"><p class="text-xs text-gray-500 mb-1">Genres:</p><div class="flex flex-wrap gap-1 items-center">${genresHTML}</div></div>
            <div class="mt-auto pt-2"><a href="../details/game-details.html?gameId=${game.id}" target="_self" class="view-details-link inline-block text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Game Page</a></div>
        </div>
    `;

    const removeButton = gameCard.querySelector('.remove-from-collection-btn');
    removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        removeFromCollection(game.id);
        showToast(`"${game.name}" removed from collection.`);
        displayCollectionGames(); // Refresh the entire page content
    });

    gameCard.addEventListener('click', (event) => {
        if (!event.target.closest('.remove-from-collection-btn')) {
            window.location.href = `../details/game-details.html?gameId=${game.id}`;
        }
    });

    return gameCard;
}

function displayCollectionGames() {
    const collection = getCollection();
    collectionGamesGrid.innerHTML = '';

    if (collection.length === 0) {
        emptyCollectionMessage.classList.remove('hidden');
        collectionGamesGrid.classList.add('hidden');
        if(liveStreamsSection) liveStreamsSection.classList.add('hidden'); // Hide streams if collection is empty
    } else {
        emptyCollectionMessage.classList.add('hidden');
        collectionGamesGrid.classList.remove('hidden');
        collection.forEach(game => {
            const gameCard = createCollectionGameCard(game);
            collectionGamesGrid.appendChild(gameCard);
        });
        // After displaying the games, load the streams for them
        loadLiveStreamsForCollection(collection);
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', displayCollectionGames);
