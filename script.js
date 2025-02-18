class GameState {
    constructor() {
        this.requiredLetter = null;
        this.validWords = [];
        this.foundWords = [];
        this.puzzleLetters = [];
        this.puzzleLength = [];
        this.gameStateKey = 'gamestate';
    }

    loadGameState() {
        const saved = localStorage.getItem(this.gameStateKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            this.requiredLetter = parsed.requiredLetter;
            this.validWords = parsed.validWords;
            this.foundWords = parsed.foundWords;
            this.puzzleLetters = parsed.puzzleLetters;
            this.puzzleLength = parsed.puzzleLength;
        }

        console.log('puzzle letters:', this.puzzleLetters);
        console.log('required letter:', this.requiredLetter);
        console.log('buzzwords:', getPangrams(this.validWords, this.puzzleLength));
        console.log(this.puzzleLength);
        console.log('valid words:', this.validWords);
        shuffleLetters()
        displayLetters();
        return saved;
    }

    saveGameState() {
        localStorage.setItem(this.gameStateKey, JSON.stringify({
            requiredLetter: this.requiredLetter,
            validWords: this.validWords,
            foundWords: this.foundWords,
            puzzleLetters: this.puzzleLetters,
            puzzleLength: this.puzzleLength,
        }));
    }

    init() {
    }
}

function load() {
    gameState = new GameState();
    currentGame = gameState.loadGameState();

    if (! currentGame) {
        init();
    } else {
        gameState.saveGameState();
    }
}

async function init() {
    localStorage.clear();
    console.log('clear');
    const puzzleLength = getPuzzleLength();
    const response = await fetch('scrabble.txt');
    const text = await response.text();
    const wordList = text.toLowerCase().split('\n').map(word => word.trim()).filter(word => word.length >= 4);
    const pangrams = wordList.filter((word) => {
        const unique = new Set(word.split(''));
        return unique.size === puzzleLength;
    });
    const buzzword = pangrams[Math.floor(Math.random() * pangrams.length)];

    const requiredLetter = buzzword[Math.floor(Math.random() * buzzword.length)];
    
    const validWords = wordList.filter((word) => {
        return word.includes(requiredLetter) &&
            [...word].every(c => buzzword.includes(c));
    });

    const letters = [...new Set(buzzword.split(''))];

    const gameState = new GameState();
    gameState.requiredLetter = requiredLetter;
    gameState.validWords = validWords;
    gameState.puzzleLetters = letters;
    gameState.saveGameState();

    displayLetters();
    location.reload();
}

function getPuzzleLength() {
    const defaultLength = 7;
    let puzzleLength = prompt("Enter puzzle length (4-9), or leave empty for default (7):");
    if (puzzleLength) {
        const length = parseInt(puzzleLength);
        if (length >= 4 && length <= 9) {
            puzzleLength = length;
        } else {
            alert("Invalid length. Using default length of " + defaultLength + ".");
            puzzleLength = defaultLength;
        }
    } else {
        puzzleLength = defaultLength;
    }
    this.puzzleLetters = puzzleLength;
    return puzzleLength;
}

function displayLetters() {
    const lettersDiv = document.getElementById('letters');
    lettersDiv.innerHTML = '';
    gameState.puzzleLetters.forEach(letter => {
        const span = document.createElement('span');
        span.className = letter === gameState.requiredLetter ? 'letter required' : 'letter';
        span.textContent = letter.toUpperCase();
        span.onclick = () => addLetter(letter);
        lettersDiv.appendChild(span);
    });
}

function getPangrams(validWords, puzzleLength) {
    return validWords.filter(word => {
        const unique = new Set(word.split(''));
        return unique.size === puzzleLength;
    });
}

load();


function handleKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitWord();
    }
}

function addLetter(letter) {
    const input = document.getElementById('wordInput');
    const span = document.createElement('span');
    span.textContent = letter.toLowerCase();
    input.appendChild(span);
    placeCaretAtEnd(input);
}

function removeLastLetter() {
    const input = document.getElementById('wordInput');
    setInputText(input, input.textContent.slice(0, -1));
    placeCaretAtEnd(input);
}

document.getElementById('wordInput').addEventListener('keydown', handleKeyPress);

document.getElementById('wordInput').addEventListener('input', function (e) {
    const text = this.textContent.toLowerCase().replace(/[^a-z]/g, ""); 

    setInputText(this, text);
    placeCaretAtEnd(this);
});

function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

function setInputText(input, text) {
    const newText = text.split('').map(letter => {
        const isValid = gameState.puzzleLetters.includes(letter);
        return `<span class="${isValid ? '' : 'invalid-letter'}">${letter}</span>`;
    }).join('');

    input.innerHTML = newText;
}
function shuffleLetters() {
    const shuffled = [...gameState.puzzleLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    gameState.puzzleLetters = shuffled;
    displayLetters();
}

function submitWord() {
    const input = document.getElementById('wordInput');
    const word = input.textContent.toLowerCase();
    const maxScore = gameState.validWords.reduce((sum, word) => sum + calculateScore(word), 0);
    const score = gameState.foundWords.reduce((sum, word) => sum + calculateScore(word), 0);


    if (!word) return;

    const invalidLetters = [...word].filter(c => !puzzleLetters.includes(c));
    if (invalidLetters.length > 0) {
        showDialog('Invalid letters');
        return;
    }

    if (word.length < 4) {
        showDialog('Too short');
        return;
    }

    if (this.foundWords.has(word)) {
        showDialog('Already found');
        return;
    }

    if (this.validWords.includes(word)) {
        const wordScore = calculateScore(word); // Calculate the score for the word
        totalScore += wordScore; // Add score to total score
        this.foundWords.add(word); // Add word to the set of found words

        const foundDiv = document.getElementById('foundWords'); // Get the div to display found words
        foundDiv.innerHTML = Array.from(this.foundWords).map(w => // Map found words to HTML for display
            `<span class="word-entry">${w}&nbsp;(${calculateScore(w)})</span>` // Format each word with its score
        ).toReversed().join(', '); // Join words into a single HTML string

        showDialog("Nice!", false); // Show dialog with the score for the found word
        showDialogScore(wordScore);

        document.getElementById('scoreBar-inner').style.width = (totalScore / totalMaxScore * 100) + "%";

        document.getElementById('wordInput').innerHTML = ""; // Clear the word input
        updateScoreDisplay(); // Update the score display
        updateWordCounts(); // Update the word counts display
        saveGameState()

    } else {
        showDialog('Invalid word'); // Show dialog for invalid word
    }
}

function calculateScore(word) {
    if (word.length < 4) return 0;

    let score = word.length === 4 ? 1 : word.length;

    const uniqueLetters = new Set(word.split(''));
    if (uniqueLetters.size === puzzleLength) {
        score += puzzleLength;
    }

    return score;
}