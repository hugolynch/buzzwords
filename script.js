// Global variables to store game state
let validWords = []; // Array to hold valid words for the current puzzle
let foundWords = new Set(); // Set to keep track of words found by the player (using Set for efficient lookups)
let puzzleLetters = []; // Array to store the letters of the current puzzle
let requiredLetter = ''; // The required letter that must be in every valid word
let totalScore = 0; // Player's current score
let totalMaxScore = 0; // Maximum possible score for the current puzzle

// Initialize puzzleLength from localStorage or default to 7
let puzzleLength = localStorage.getItem('puzzleLength') ?
    parseInt(localStorage.getItem('puzzleLength')) : 7;

document.addEventListener('keydown', (event) => {
    const input = document.getElementById('wordInput');
    if (event.key === 'Enter') {
        submitWord();
    } else {
        input.focus();
    }
});

// Function to load the word list from 'scrabble.txt'
async function loadWordList() {
    const response = await fetch('scrabble.txt'); // Fetch the word list file
    const text = await response.text(); // Get the text content of the file
    return text.toLowerCase().split('\n').map(word => word.trim()).filter(word => word.length >= 4); // Convert to lowercase, split into words, trim whitespace, and filter words of length 4 or more
}

// Class to manage game state persistence using localStorage
class GameStateManager {
    constructor() {
        this.gameStateKey = 'buzzwordsSave'; // Key for saving game state in localStorage
        this.puzzleLengthKey = 'puzzleLength'; // Key for saving puzzle length in localStorage
    }

    // Save the current game state to localStorage
    saveGameState(gameState) {
        localStorage.setItem(this.gameStateKey, JSON.stringify(gameState)); // Serialize and store game state
    }

    // Load game state from localStorage
    loadGameState() {
        const saved = localStorage.getItem(this.gameStateKey); // Retrieve serialized game state
        return saved ? JSON.parse(saved) : null; // Deserialize and return game state, or null if no saved state
    }

    // Clear the saved game state from localStorage
    clearGameState() {
        localStorage.removeItem(this.gameStateKey); // Remove game state from localStorage
    }

    // Save the puzzle length to localStorage
    savePuzzleLength(length) {
        localStorage.setItem(this.puzzleLengthKey, length); // Store puzzle length in localStorage
    }

    // Load the puzzle length from localStorage, or default to 7 if not found
    loadPuzzleLength() {
        return localStorage.getItem(this.puzzleLengthKey) ?
            parseInt(localStorage.getItem(this.puzzleLengthKey)) : 7; // Retrieve and parse puzzle length, or default to 7
    }
}

const gameStateManager = new GameStateManager(); // Instantiate the GameStateManager

// Function to get pangrams (words that use all puzzle letters) from a word list
function getPangrams(wordList) {
    return wordList.filter(word => { // Filter the word list
        const unique = new Set(word.split('')); // Get unique letters in the word
        return unique.size === puzzleLength; // Check if the number of unique letters equals the puzzle length
    });
}

// Function to generate a new puzzle
function generatePuzzle(wordList) {
    const pangrams = getPangrams(wordList); // Get pangrams from the word list
    const selectedPangram = pangrams[Math.floor(Math.random() * pangrams.length)]; // Randomly select a pangram
    puzzleLetters = [...new Set(selectedPangram.split(''))]; // Extract unique letters from the pangram
    requiredLetter = puzzleLetters[Math.floor(Math.random() * puzzleLetters.length)]; // Randomly select a required letter from the puzzle letters

    validWords = wordList.filter(word => { // Filter the word list to find valid words for the puzzle
        const lowerWord = word.toLowerCase(); // Convert word to lowercase for case-insensitive comparison
        return lowerWord.includes(requiredLetter) && // Word must contain the required letter
            [...lowerWord].every(c => puzzleLetters.includes(c)); // Every letter in the word must be in the puzzle letters
    });
}

// Function to update the displayed word counts
function updateWordCounts() {
    document.getElementById('foundCount').textContent = foundWords.size; // Update the count of found words
    document.getElementById('totalWords').textContent = validWords.length; // Update the total number of valid words
}

// Function to display the puzzle letters on the screen
function displayLetters() {
    const lettersDiv = document.getElementById('letters'); // Get the div to display letters
    lettersDiv.innerHTML = ''; // Clear existing letters
    puzzleLetters.forEach(letter => { // Iterate through puzzle letters
        const span = document.createElement('span'); // Create a span for each letter
        span.className = letter === requiredLetter ? 'letter required' : 'letter'; // Apply 'required' class to the required letter
        span.textContent = letter.toUpperCase(); // Set letter text to uppercase
        span.onclick = () => addLetter(letter); // Add onclick handler to add letter to input
        lettersDiv.appendChild(span); // Append letter span to letters div
    });
}

// Function to calculate the score for a given word
function calculateScore(word) {
    if (word.length < 4) return 0; // Words shorter than 4 letters score 0

    let score = word.length === 4 ? 1 : word.length; // Base score is word length (or 1 for 4-letter words)

    const uniqueLetters = new Set(word.split('')); // Get unique letters in the word
    if (uniqueLetters.size === puzzleLength) { // Check if it's a pangram (uses all puzzle letters)
        score += puzzleLength; // Add puzzleLength points for pangrams
    }

    return score; // Return calculated score
}

// Function to update the displayed score
function updateScoreDisplay() {
    document.getElementById('totalScore').textContent = totalScore; // Update the total score display
    document.getElementById('maxScore').textContent = totalMaxScore; // Update the maximum score display
}

// Function to show a dialog message temporarily
function showDialog(message, clear = true) {
    const dialog = document.getElementById('messageDialog'); // Get the dialog element
    document.getElementById('dialogContent').textContent = message; // Set the dialog message
    dialog.style.display = 'flex'; // Show the dialog

    setTimeout(() => {
        dialog.style.display = 'none'; // Hide the dialog after a delay
        const input = document.getElementById('wordInput') // Get the word input element
        if (clear) {
            input.innerHTML = ''; // Clear the word input
        }
    }, 1000); // Delay for 1 second (1000 milliseconds)
}

function showDialogScore(message) {
    const dialog = document.getElementById('messageDialogScore');
    document.getElementById('dialogScore').textContent = "+";
    document.getElementById('dialogScore').textContent += message;
    document.getElementById('dialogScore').style.display = 'block';

    setTimeout(() => {
        document.getElementById('dialogScore').style.display = 'none';
    }, 990);
}
// Function to handle word submission
function submitWord() {
    const input = document.getElementById('wordInput'); // Get the word input element
    const word = input.textContent.toLowerCase(); // Get the entered word in lowercase

    if (!word) return; // Do nothing if the input word is empty

    const invalidLetters = [...word].filter(c => !puzzleLetters.includes(c)); // Find invalid letters in the word
    if (invalidLetters.length > 0) {
        showDialog('Invalid letters'); // Show dialog for invalid letters
        // shake();
        return; // Exit function
    }

    if (word.length < 4) {
        showDialog('Too short'); // Show dialog for words too short
        return; // Exit function
    }

    if (foundWords.has(word)) {
        showDialog('Already found'); // Show dialog if word already found
        return; // Exit function
    }

    if (validWords.includes(word)) { // Check if the word is in the list of valid words
        const wordScore = calculateScore(word); // Calculate the score for the word
        totalScore += wordScore; // Add score to total score
        foundWords.add(word); // Add word to the set of found words

        const foundDiv = document.getElementById('foundWords'); // Get the div to display found words
        foundDiv.innerHTML = Array.from(foundWords).map(w => // Map found words to HTML for display
            `<span class="word-entry">${w}&nbsp;(${calculateScore(w)})</span>` // Format each word with its score
        ).toReversed().join(', '); // Join words into a single HTML string

        showDialog("Nice!", false); // Show dialog with the score for the found word
        showDialogScore(wordScore);

        document.getElementById('scoreBar-inner').style.width = (totalScore / totalMaxScore * 100) + "%";

        document.getElementById('wordInput').innerHTML = ""; // Clear the word input
        updateScoreDisplay(); // Update the score display
        updateWordCounts(); // Update the word counts display
        gameStateManager.saveGameState({ // Save the updated game state
            foundWords: Array.from(foundWords),
            puzzleLetters,
            requiredLetter,
            totalScore,
            totalMaxScore,
            validWords,
        });

    } else {
        showDialog('Invalid word'); // Show dialog for invalid word
    }
}

// Function to display pangrams in the console (for debugging/cheating)
function displayPangrams() {
    const pangrams = validWords.filter(word => { // Filter valid words to find pangrams
        const uniqueLetters = new Set(word.split('')); // Get unique letters in the word
        return uniqueLetters.size === puzzleLength; // Check if it's a pangram
    });
    console.log('Puzzle Pangrams:', pangrams); // Log pangrams to the console
    return pangrams; // Return pangrams array
}

// Function to shuffle the puzzle letters
function shuffleLetters() {
    const shuffled = [...puzzleLetters]; // Create a copy of puzzle letters to avoid modifying original directly
    for (let i = shuffled.length - 1; i > 0; i--) { // Fisher-Yates shuffle algorithm
        const j = Math.floor(Math.random() * (i + 1)); // Generate a random index j
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements at i and j
    }
    puzzleLetters = shuffled; // Update puzzle letters with shuffled letters
    displayLetters(); // Redisplay letters on the screen
    gameStateManager.saveGameState({ // Save the updated game state after shuffling
        foundWords: Array.from(foundWords),
        puzzleLetters,
        requiredLetter,
        totalScore,
        totalMaxScore,
        validWords,
    });
}

// Function to handle key press events, specifically for Enter key submission
function handleKeyPress(event) {
    if (event.key === 'Enter') { // Check if the pressed key is Enter
        event.preventDefault(); // Prevent default form submission behavior
        submitWord(); // Submit the current word
    }
}

// Function to add a letter to the word input
function addLetter(letter) {
    const input = document.getElementById('wordInput'); // Get the word input element
    const span = document.createElement('span'); // Create a span for the letter
    span.textContent = letter.toLowerCase(); // Set letter text to lowercase
    input.appendChild(span); // Append letter span to the input
    placeCaretAtEnd(input); // Move caret to the end of the input
}

// Function to remove the last letter from the word input
function removeLastLetter() {
    const input = document.getElementById('wordInput'); // Get the word input element
    setInputText(input, input.textContent.slice(0, -1)); // Remove the last character from input text
    placeCaretAtEnd(input); // Move caret to the end of the input
}

// Redundant displayLetters function - already defined above. Keeping the first one and removing this.
// function displayLetters() {
//     const lettersDiv = document.getElementById('letters');
//     lettersDiv.innerHTML = '';
//     puzzleLetters.forEach(letter => {
//         const span = document.createElement('span');
//         span.className = letter === requiredLetter ? 'letter required' : 'letter';
//         span.textContent = letter.toUpperCase();
//         span.onclick = () => addLetter(letter);
//         lettersDiv.appendChild(span);
//     });
// }

// Event listener for keydown on the word input (for Enter key handling)
document.getElementById('wordInput').addEventListener('keydown', handleKeyPress);

// Event listener for input changes on the word input (for sanitizing input)
document.getElementById('wordInput').addEventListener('input', function (e) {
    const text = this.textContent.toLowerCase().replace(/[^a-z]/g, ""); // Get lowercase text and remove non-alphabetic characters

    setInputText(this, text); // Update input text with sanitized text
    placeCaretAtEnd(this); // Move caret to the end of the input
});

// Function to place the caret at the end of a contentEditable element
function placeCaretAtEnd(el) {
    el.focus(); // Focus the element
    const range = document.createRange(); // Create a new range
    const sel = window.getSelection(); // Get the current selection
    range.selectNodeContents(el); // Select all content of the element
    range.collapse(false); // Collapse the range to the end
    sel.removeAllRanges(); // Remove any existing selections
    sel.addRange(range); // Add the new range, effectively moving caret to the end
}

// Function to set the text content of the input, applying styling for valid/invalid letters
function setInputText(input, text) {
    const newText = text.split('').map(letter => { // Map each letter to a styled span
        const isValid = puzzleLetters.includes(letter); // Check if the letter is valid for the puzzle
        return `<span class="${isValid ? '' : 'invalid-letter'}">${letter}</span>`; // Create span with 'invalid-letter' class if invalid
    }).join(''); // Join the spans into a single HTML string

    input.innerHTML = newText; // Set the innerHTML of the input element
}

// Async function to initialize the game
async function initializeGame() {
    const wordList = await loadWordList(); // Load the word list
    const savedData = gameStateManager.loadGameState(wordList); // Load saved game state from localStorage

    console.log("START");
    if (!savedData) {
        // New game path
        generatePuzzle(wordList); // Generate a new puzzle
        shuffleLetters(); // Shuffle the puzzle letters
        totalMaxScore = validWords.reduce((sum, word) => sum + calculateScore(word), 0); // Calculate the maximum possible score
        console.log("Initialized new game");

        gameStateManager.saveGameState({ // Save the initial game state
            foundWords: Array.from(foundWords),
            puzzleLetters,
            requiredLetter,
            totalScore,
            totalMaxScore,
            validWords,
        });
    } else {
        // Saved game path
        puzzleLetters = savedData.puzzleLetters; // Restore puzzle letters from saved state
        requiredLetter = savedData.requiredLetter; // Restore required letter
        foundWords = new Set(savedData.foundWords); // Restore found words set
        totalScore = savedData.totalScore; // Restore total score
        validWords = savedData.validWords;

        totalMaxScore = validWords.reduce((sum, word) => sum + calculateScore(word), 0); // Recalculate max score based on loaded puzzle
        console.log("Loaded saved game");
    }

    // Common initialization for both new and loaded games
    displayLetters(); // Display the puzzle letters
    updateScoreDisplay(); // Update the score display
    updateWordCounts(); // Update the word counts display
    displayPangrams(); // Log pangrams to console (for debugging)
    console.log('Valid words:', validWords); // Log valid words to console (for debugging)

    document.getElementById('scoreBar-inner').style.width = (totalScore / totalMaxScore * 100) + "%";
    document.getElementById('foundWords').innerHTML = // Display the list of found words
        Array.from(foundWords).map(w =>
            `<span class="word-entry">${w}&nbsp;(${calculateScore(w)})</span>` // Format each found word with its score
        ).toReversed().join(', '); // Sort found words alphabetically and join into HTML string
}

// Function to start a new game (triggered by user action)
function newGame() {
    const newLength = prompt("Enter puzzle length (4-9), or leave empty for default (7):"); // Prompt user for new puzzle length
    if (newLength) { // If a new length was entered
        const length = parseInt(newLength); // Parse the input as an integer
        if (length >= 4 && length <= 9) { // Validate the length
            puzzleLength = length; // Set the new puzzle length
            gameStateManager.savePuzzleLength(length); // Save the new puzzle length to localStorage
        } else {
            alert("Invalid length. Using default length of 7."); // Alert for invalid length
            puzzleLength = 7; // Reset to default length
            gameStateManager.savePuzzleLength(7); // Save the default puzzle length
        }
    } else { // If no new length was entered (user pressed cancel or left empty)
        puzzleLength = 7; // Reset to default length
        gameStateManager.savePuzzleLength(7); // Save the default puzzle length
    }
    gameStateManager.clearGameState(); // Clear the saved game state to start fresh
    foundWords.clear(); // Clear found words
    totalScore = 0; // Reset total score
    window.location.href = window.location.href.split('?')[0] + '?nocache=' + Date.now(); // Reload the page to reset game state and bust cache
}

// Function to start a new puzzle with a custom word list
function newPuzzleCustomList() {
    const customWordListText = prompt("Enter your custom word list, separated by commas:");
    if (customWordListText) {
        const customWordList = customWordListText.toLowerCase().split(',').map(word => word.trim()).filter(word => word.length >= 4);

        if (customWordList.length === 0) {
            alert("Invalid word list. Please enter at least one word of length 4 or more.");
            return;
        }

        // Generate puzzle letters from the custom word list
        const allLetters = new Set();
        customWordList.forEach(word => {
            for (const letter of word) {
                allLetters.add(letter);
            }
        });

        if (allLetters.size < 4 || allLetters.size > 9) {
            alert("The custom word list must contain between 4 and 9 unique letters.");
            return;
        }

        puzzleLetters = Array.from(allLetters);
        puzzleLength = puzzleLetters.length;
        requiredLetter = puzzleLetters[Math.floor(Math.random() * puzzleLetters.length)];

        validWords = customWordList;
        console.log("Valid words:", validWords);

        if (validWords.length === 0) {
            alert("No valid words could be formed with the given word list and required letter.");
            return;
        }

        gameStateManager.clearGameState();
        foundWords.clear();
        totalScore = 0;
        totalMaxScore = validWords.reduce((sum, word) => sum + calculateScore(word), 0);

        displayLetters();
        updateScoreDisplay();
        updateWordCounts();
        displayPangrams();

        gameStateManager.saveGameState({
            foundWords: Array.from(foundWords),
            puzzleLetters,
            requiredLetter,
            totalScore,
            totalMaxScore,
            validWords,
        });
    } else {
        alert("Custom word list creation cancelled.");
    }
    window.location.href = window.location.href.split('?')[0] + '?nocache=' + Date.now(); // Reload the page to reset game state and bust cache

}

// Initialize the game when the script loads
initializeGame();