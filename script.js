class GameState {
    constructor() {
        this.requiredLetter = null;
        this.validWords = [];
        this.foundWords = [];
        this.puzzleLetters = [];
        this.puzzleLength = [];
        this.totalScore = 0;
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
            this.totalScore = parsed.totalScore;
        }
        shuffleLetters();
        this.render();

        return saved;
    }

    saveGameState() {
        localStorage.setItem(this.gameStateKey, JSON.stringify({
            requiredLetter: this.requiredLetter,
            validWords: this.validWords,
            foundWords: Array.from(this.foundWords),
            puzzleLetters: this.puzzleLetters,
            puzzleLength: this.puzzleLength,
            totalScore: this.totalScore,
        }));

        console.clear();
        console.log('buzzwords:', getPangrams(this.validWords, this.puzzleLength));
        console.log('valid words:', this.validWords);

        console.log(generateLetterDistributionGrid(this));
        generateLetterDistributionGrid(this);
    }

    render() {
        document.getElementById('scoreBar-inner').style.width = (gameState.totalScore / updateScoreDisplay() * 100) + "%";
        document.getElementById('totalScore').textContent = gameState.totalScore;
        document.getElementById('maxScore').textContent = updateScoreDisplay();
        document.getElementById('rank').textContent = findRank(gameState);
        document.getElementById('foundCount').textContent = gameState.foundWords.length;
        document.getElementById('totalWords').textContent = gameState.validWords.length;

        document.getElementById('foundWords').innerHTML = Array.from(gameState.foundWords).map(w =>
            `<span class="word-entry">${w}&nbsp;(${calculateScore(w)})</span>`
        ).toReversed().join(', ');
    }
}

function load() {
    gameState = new GameState();
    const loadedStateFromHash = loadGameStateFromHash();

    if (loadedStateFromHash) {
        gameState = loadedStateFromHash;
        gameState.saveGameState();
    } else {
        const saved = gameState.loadGameState();
        if (!saved) {
            init(gameState);
        } else {
            gameState.saveGameState();
        }
    }
    shuffleLetters();
    gameState.render();
}

async function init(gameState) {
    localStorage.clear();
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

    gameState.requiredLetter = requiredLetter;
    gameState.validWords = validWords;
    gameState.puzzleLetters = letters;
    gameState.puzzleLength = puzzleLength;
    gameState.foundWords = [];
    gameState.totalScore = 0;
    gameState.saveGameState();
    shuffleLetters();
    gameState.render();
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
    const text = e.target.textContent.toLowerCase().replace(/[^a-z]/g, ""); 
    setInputText(e.target, text);
    placeCaretAtEnd(e.target);
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
    const invalidLetters = [...word].filter(c => !gameState.puzzleLetters.includes(c));
    if (!word) return;

    if (invalidLetters.length > 0) {
        showDialog('Invalid letters');
        return;
    }

    if (!word.includes(gameState.requiredLetter)) {
        showDialog('Missing required letter');
        return;
    }

    if (word.length < 4) {
        showDialog('Too short');
        return;
    }

    if (gameState.foundWords.includes(word)) {
        showDialog('Already found');
        return;
    }

    if (gameState.validWords.includes(word)) {
        const wordScore = calculateScore(word);
        gameState.totalScore += wordScore;
        gameState.foundWords.push(word);

        const foundDiv = document.getElementById('foundWords');
        foundDiv.innerHTML = Array.from(gameState.foundWords).map(w =>
            `<span class="word-entry">${w}&nbsp;(${calculateScore(w)})</span>`
        ).toReversed().join(', ');

        showDialog("Nice!", false);
        showDialogScore(wordScore);


        document.getElementById('wordInput').innerHTML = "";

        // document.getElementById('scoreBar-inner').style.width = (gameState.totalScore / updateScoreDisplay() * 100) + "%";
        // document.getElementById('totalScore').textContent = gameState.totalScore;
        // document.getElementById('maxScore').textContent = updateScoreDisplay();
        // document.getElementById('foundCount').textContent = gameState.foundWords.length;
        // document.getElementById('totalWords').textContent = gameState.validWords.length;
        gameState.render();
        gameState.saveGameState();
        console.log(gameState.foundWords);

    } else {
        showDialog('Invalid word');
    }
}

function calculateScore(word) {
    if (word.length < 4) return 0;
    let score = word.length === 4 ? 1 : word.length;

    const uniqueLetters = new Set(word.split(''));
    if (uniqueLetters.size === gameState.puzzleLength) {
        score += gameState.puzzleLength;
    }

    return score;
}

function showDialog(message, clear = true) {
    const dialog = document.getElementById('messageDialog');
    document.getElementById('dialogContent').textContent = message;
    dialog.style.display = 'flex';

    setTimeout(() => {
        dialog.style.display = 'none';
        const input = document.getElementById('wordInput')
        if (clear) {
            input.innerHTML = '';
        }
    }, 1000);
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

function updateScoreDisplay() {
    let totalMaxScore = 0;
    for (const word of gameState.validWords) {
        totalMaxScore += calculateScore(word);
    }
    return totalMaxScore;
}

function customPuzzle(gameState) {
    const wordListPrompt = prompt("Enter your custom word list as a JavaScript array");
    if (wordListPrompt) {
        let customWordList;
        try {
            customWordList = JSON.parse(wordListPrompt.toLowerCase());

            
            if (!Array.isArray(customWordList)) {
                alert("Invalid input. Please enter a valid JavaScript array of words.");
                return;
            }
            customWordList = customWordList.map(word => word.trim()).filter(word => word.length >= 4);
        } catch (e) {
            alert("Invalid array format. Please use valid JavaScript array syntax (e.g., [\"word1\", \"word2\", \"word3\"]).");
            return;
        }


        if (customWordList.length === 0) {
            alert("Invalid word list. Please enter at least one word of length 4 or more.");
            return;
        }

        const puzzleLetters = [];
        customWordList.forEach(word => {
            for (const letter of word) {
                if (!puzzleLetters.includes(letter)) {
                    puzzleLetters.push(letter);
                }
            }
        });
        const requiredLetter = prompt(`Enter the required letter from these letters: ${puzzleLetters.join(', ')}:`);
        if (!puzzleLetters.includes(requiredLetter)) {
            alert("Invalid required letter. Please choose one of the letters in the puzzle.");
            return;
        }

        if (puzzleLetters.size < 4 || puzzleLetters.size > 9) {
            alert("The custom word list must contain between 4 and 9 unique letters.");
            return;
        }

        console.log("Valid words:", customWordList);

        if (customWordList.length === 0) {
            alert("No valid words could be formed with the given word list and required letter.");
            return;
        }

        gameState.puzzleLetters = puzzleLetters;
        gameState.puzzleLength = gameState.puzzleLetters.length;
        gameState.requiredLetter = requiredLetter;
        gameState.validWords = customWordList;
        gameState.totalScore = 0;
        gameState.foundWords = [];
        gameState.saveGameState();
        shuffleLetters();
        gameState.render();

    } else {
        alert("Custom puzzle creation cancelled.");
    }
}

async function seededPuzzle(gameState) {
    const letters = prompt("Enter 4-9 unique letters:");
    if (letters) {
        if (letters.length < 4 || letters.length > 9 || (new Set(letters)).size !== letters.length) {
            alert("Invalid input. Please enter 4-9 unique letters.");
            return;
        }
        gameState.puzzleLetters = [...new Set(letters)].sort();
        gameState.puzzleLength = gameState.puzzleLetters.length;

        const requiredLetter = prompt(`Enter the required letter from these letters: ${gameState.puzzleLetters.join(', ')}:`);
        if (!gameState.puzzleLetters.includes(requiredLetter)) {
            alert("Invalid required letter. Please choose one of the letters in the puzzle.");
            return;
        }

    const response = await fetch('scrabble.txt');
    const text = await response.text();
    const wordList = text.toLowerCase().split('\n').map(word => word.trim()).filter(word => word.length >= 4);

    const validWords = wordList.filter((word) => {
        return word.includes(requiredLetter) &&
            [...word].every(c => letters.includes(c));
    });

        gameState.requiredLetter = requiredLetter;
        gameState.validWords = validWords;
        gameState.totalScore = 0;
        gameState.foundWords = [];
        gameState.saveGameState();
        shuffleLetters();
        gameState.render();

    } else {
        alert("Seeded puzzle creation cancelled.");
    }
}

function generatePuzzleHash(gameState) {
    const puzzleDefinition = {
        puzzleLetters: gameState.puzzleLetters,
        requiredLetter: gameState.requiredLetter,
        puzzleLength: gameState.puzzleLength,
        validWords: gameState.validWords,
    };
    const jsonString = JSON.stringify(puzzleDefinition);
    const base64Hash = btoa(jsonString);
    return base64Hash;
}

function loadGameStateFromHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        try {
            const jsonString = atob(hash);
            const puzzleDefinition = JSON.parse(jsonString);

            const loadedGameState = new GameState();
            loadedGameState.puzzleLetters = puzzleDefinition.puzzleLetters;
            loadedGameState.requiredLetter = puzzleDefinition.requiredLetter;
            loadedGameState.puzzleLength = puzzleDefinition.puzzleLength;
            loadedGameState.validWords = puzzleDefinition.validWords;
            window.history.replaceState(null, '', window.location.origin + window.location.pathname);
            return loadedGameState;
        } catch (error) {
            console.error("Error loading game state from hash:", error);
            return null;
        }
    }
    
    return null;
}

function findRank(gameState) {
    const current = gameState.totalScore;
    const max = updateScoreDisplay(gameState);

    let currentRank = "";
    const ranks = [
        {"value": 0, "rank": "Egg"},
        {"value": 0.2, "rank": " Larva"},
        {"value": 0.4, "rank": " Pupa"},
        {"value": 0.6, "rank": " Drone"},
        {"value": 0.8, "rank": " Worker"},
        {"value": 1, "rank": " Queen Bee"},
    ];

    for (let step = 0; step < ranks.length; step++) {
        if (current/max >= ranks[step].value) {
            currentRank = ranks[step].rank;
        }
    }

    return currentRank;
}

function generateLetterDistributionGrid(gameState) {
    const distribution = {};
    const startingLetters = new Set();
    const wordLengths = new Set();
    let bingo = true;

    // Initialize distribution object
    for (const word of gameState.validWords) {
        const startLetter = word[0].toUpperCase();
        const length = word.length;
        startingLetters.add(startLetter);
        wordLengths.add(length);
        if (!distribution[startLetter]) {
            distribution[startLetter] = {};
        }
        distribution[startLetter][length] = (distribution[startLetter][length] || 0) + 1;
    }

    if (startingLetters.size !== gameState.puzzleLetters.length) {
        bingo = false;
    }

    const sortedLetters = Array.from(startingLetters).sort();
    const sortedLengths = Array.from(wordLengths).sort((a, b) => a - b);

    let gridString = '\t'; // Initial spacing for alignment

    // Header row (lengths)
    for (const length of sortedLengths) {
        gridString += `${length}\t`;
    }
    gridString += 'Σ\n'; // Total column header

    let totalWordsOverall = 0;

    // Letter rows
    for (const letter of sortedLetters) {
        gridString += `${letter}\t`;
        let totalWordsPerLetter = 0;
        for (const length of sortedLengths) {
            const count = distribution[letter][length] || '-';
            gridString += `${count}\t`;
            if (typeof count === 'number') {
                totalWordsPerLetter += count;
            }
        }
        gridString += `${totalWordsPerLetter}\n`; // Total for the letter row
        totalWordsOverall += totalWordsPerLetter;
    }

    // Total row
    gridString += 'Σ\t';
    let totalWordsPerLength = {};
    for (const length of sortedLengths) {
        totalWordsPerLength[length] = 0;
        for (const letter of sortedLetters) {
            if (distribution[letter] && distribution[letter][length]) {
                totalWordsPerLength[length] += distribution[letter][length];
            }
        }
        gridString += `${totalWordsPerLength[length]}\t`;
    }
    gridString += `${totalWordsOverall}\n`; // Grand total

    if (bingo) {
        gridString = "BINGO!\n" + gridString;
    }
    return gridString;
}

function copyURL(gameState) {
    const puzzleHash = generatePuzzleHash(gameState);
    navigator.clipboard.writeText(window.location.origin + window.location.pathname + "#" + puzzleHash);

    document.getElementById('share').textContent = "Copied to Clipboard ✅";

  setTimeout(() => {
    document.getElementById('share').textContent = 'Copy Puzzle';
  }, 2000);
}