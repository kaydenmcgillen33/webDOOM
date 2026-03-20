// gameState.js

// Function to save game state to localStorage
function saveGame(gameState) {
    localStorage.setItem('gameProgress', JSON.stringify(gameState));
}

// Function to load game state from localStorage
function loadGame() {
    const savedGame = localStorage.getItem('gameProgress');
    return savedGame ? JSON.parse(savedGame) : null;
}

// Function to clear saved game states
function clearSaves() {
    localStorage.removeItem('gameProgress');
}

// Auto-save functionality
setInterval(() => {
    const currentGameState = getCurrentGameState(); // Assume this function gets the current game state
    saveGame(currentGameState);
}, 60000); // Save every minute
