// src/js/config.js

// Replace 'YOUR_RAWG_API_KEY_HERE' with your actual RAWG API key.
// You can get a free API key by registering at https://rawg.io/login?forward=developer
export const apiKey = 'efc7e659220e4c39b3b9f578a19524a0'; // Example key, replace it!

// Number of games to display per page in the main games list.
export const pageSize = 10;

// Twitch API Credentials
// IMPORTANT: In a real-world application, the clientSecret should NEVER be exposed in the frontend.
// This should be handled by a backend server that requests the token and passes it to the client.
export const twitchClientId = '0qetiul2z4lvfqa663qalicbzg8xxx';
export const twitchClientSecret = 'yfys5buxu65uz6envlab55g8z6px3m'; // DANGER: For demonstration only. Keep this secret on a server.


// Array of game names (case-insensitive) to be excluded from the displayed results.
// This can be useful to filter out specific versions or unwanted entries.
export const excludedGameNames = [
    "Soulcalibur (1998)", // Example: Exclude the 1998 version of Soulcalibur
    "Soulcalibur"         // Example: Exclude general entries named "Soulcalibur" if needed
];
