// src/js/collectionManager.js

const COLLECTION_KEY = 'gtrackUserCollection';

/**
 * Retrieves the current game collection from localStorage.
 * @returns {Array<Object>} An array of game objects.
 */
export function getCollection() {
    const collectionJSON = localStorage.getItem(COLLECTION_KEY);
    return collectionJSON ? JSON.parse(collectionJSON) : [];
}

/**
 * Saves the game collection to localStorage.
 * @param {Array<Object>} collection - The array of game objects to save.
 */
function saveCollection(collection) {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
}

/**
 * Adds a game to the collection.
 * @param {Object} game - The game object to add.
 * Expected game object structure: { id: number, name: string, background_image: string, released: string, metacritic: number|null, platforms: Array<string>, genres: Array<string>, slug: string }
 */
export function addToCollection(game) {
    const collection = getCollection();
    if (!game || typeof game.id === 'undefined') {
        console.error("Attempted to add invalid game object to collection:", game);
        return;
    }
    // Check if the game is already in the collection by its ID
    if (!collection.find(item => item.id === game.id)) {
        collection.push(game);
        saveCollection(collection);
        console.log(`Game "${game.name}" (ID: ${game.id}) added to collection.`);
    } else {
        console.log(`Game "${game.name}" (ID: ${game.id}) is already in the collection.`);
    }
}

/**
 * Removes a game from the collection by its ID.
 * @param {number|string} gameId - The ID of the game to remove.
 */
export function removeFromCollection(gameId) {
    let collection = getCollection();
    const initialLength = collection.length;
    // Ensure gameId is treated as the same type as stored IDs (usually numbers from API)
    const idToRemove = parseInt(String(gameId), 10); 
    collection = collection.filter(item => item.id !== idToRemove);
    
    if (collection.length < initialLength) {
        saveCollection(collection);
        console.log(`Game with ID: ${idToRemove} removed from collection.`);
    } else {
        console.log(`Game with ID: ${idToRemove} not found in collection to remove.`);
    }
}

/**
 * Checks if a game is already in the collection by its ID.
 * @param {number|string} gameId - The ID of the game to check.
 * @returns {boolean} True if the game is in the collection, false otherwise.
 */
export function isGameInCollection(gameId) {
    const collection = getCollection();
    const idToCheck = parseInt(String(gameId), 10);
    return collection.some(item => item.id === idToCheck);
}
