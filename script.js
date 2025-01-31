let validWords = [];
let foundWords = new Set();
let puzzleLetters = [];
let requiredLetter = '';
let totalScore = 0;
let totalMaxScore = 0;

let puzzleLength = 7

async function loadWordList() {
    const response = await fetch('scrabble.txt');
    const text = await response.text();
    return text.toLowerCase().split('\n').map(word => word.trim()).filter(word => word.length >= 4);
}

function saveGameState() {
    const gameState = {
        foundWords: Array.from(foundWords),
        puzzleLetters,
        requiredLetter,
        totalScore,
        totalMaxScore: validWords.reduce((sum, word) => sum + calculateScore(word), 0)
    };
    localStorage.setItem('buzzwordsSave', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('buzzwordsSave');
    return saved ? JSON.parse(saved) : null;
}

function getPangrams(wordList) {
    return wordList.filter(word => {
        const unique = new Set(word.split(''));
        return unique.size === puzzleLength;
    });
}

function generatePuzzle(wordList) {
    const pangrams = getPangrams(wordList);
    const selectedPangram = pangrams[Math.floor(Math.random() * pangrams.length)];
    puzzleLetters = [...new Set(selectedPangram.split(''))];
    requiredLetter = puzzleLetters[Math.floor(Math.random() * puzzleLetters.length)];
    
    validWords = wordList.filter(word => {
        const lowerWord = word.toLowerCase();
        return lowerWord.includes(requiredLetter) && 
            [...lowerWord].every(c => puzzleLetters.includes(c));
    });
}

function updateWordCounts() {
    document.getElementById('foundCount').textContent = foundWords.size;
    document.getElementById('totalWords').textContent = validWords.length;
}

function displayLetters() {
    const lettersDiv = document.getElementById('letters');
    lettersDiv.innerHTML = '';
    puzzleLetters.forEach(letter => {
        const span = document.createElement('span');
        span.className = letter === requiredLetter ? 'letter required' : 'letter';
        span.textContent = letter.toUpperCase();
        lettersDiv.appendChild(span);
    });
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

function updateScoreDisplay() {
    document.getElementById('totalScore').textContent = totalScore;
    document.getElementById('maxScore').textContent = totalMaxScore;
}

function showDialog(message) {
    const dialog = document.getElementById('messageDialog');
    document.getElementById('dialogContent').textContent = message;
    dialog.style.display = 'block';

    setTimeout(() => {
        dialog.style.display = 'none';
        const input = document.getElementById('wordInput')
        input.innerHTML = '';
    }, 1000);
}

function submitWord() {
    const input = document.getElementById('wordInput');
    const word = input.textContent.toLowerCase();
    
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
    
    if (foundWords.has(word)) {
        showDialog('Already found');
        return;
    }

    if (validWords.includes(word)) {
        const wordScore = calculateScore(word);
        totalScore += wordScore;
        foundWords.add(word);
        
        const foundDiv = document.getElementById('foundWords');
        foundDiv.innerHTML = Array.from(foundWords).map(w => 
            `<div class="word-entry">${w} (${calculateScore(w)})</div>`
        ).sort().join('');

        document.getElementById('wordInput').innerHTML = "";
        updateScoreDisplay();
        updateWordCounts();
        saveGameState();

    } else {
        showDialog('Invalid word');
    }
}

function displayPangrams() {
    const pangrams = validWords.filter(word => {
        const uniqueLetters = new Set(word.split(''));
        return uniqueLetters.size === puzzleLength;
    });
    console.log('Puzzle Pangrams:', pangrams);
    return pangrams;
}

function shuffleLetters() {
    const shuffled = [...puzzleLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    puzzleLetters = shuffled;
    displayLetters();
}

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

function displayLetters() {
    const lettersDiv = document.getElementById('letters');
    lettersDiv.innerHTML = '';
    puzzleLetters.forEach(letter => {
        const span = document.createElement('span');
        span.className = letter === requiredLetter ? 'letter required' : 'letter';
        span.textContent = letter.toUpperCase();
        span.onclick = () => addLetter(letter);
        lettersDiv.appendChild(span);
    });
}

document.getElementById('wordInput').addEventListener('keydown', handleKeyPress);

document.getElementById('wordInput').addEventListener('input', function(e) {
    const text = this.textContent.toLowerCase().replace(/[^a-z]/g,"");
    
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
        const isValid = puzzleLetters.includes(letter);
        return `<span class="${isValid ? '' : 'invalid-letter'}">${letter}</span>`;
    }).join('');
    
    input.innerHTML = newText;
}

async function initializeGame() {
    const wordList = await loadWordList();
    const savedData = loadGameState(wordList);

    if (!savedData) {
        // New game path
        generatePuzzle(wordList);
        shuffleLetters();
        totalMaxScore = validWords.reduce((sum, word) => sum + calculateScore(word), 0);
        console.log("Initialized new game");
    } else {
        // Saved game path
        puzzleLetters = savedData.puzzleLetters;
        requiredLetter = savedData.requiredLetter;
        foundWords = new Set(savedData.foundWords);
        totalScore = savedData.totalScore;
        
        // Regenerate validWords from current dictionary
        validWords = wordList.filter(word => {
            const lowerWord = word.toLowerCase();
            return lowerWord.includes(requiredLetter) && 
                [...lowerWord].every(c => puzzleLetters.includes(c));
        });
        
        totalMaxScore = validWords.reduce((sum, word) => sum + calculateScore(word), 0);
        console.log("Loaded saved game");
    }

    // Common initialization
    displayLetters();
    updateScoreDisplay();
    updateWordCounts();
    displayPangrams();
    console.log('Valid words:', validWords);

    document.getElementById('foundWords').innerHTML = 
        Array.from(foundWords).map(w => 
            `<div class="word-entry">${w} (${calculateScore(w)})</div>`
        ).sort().join('');
}

function newGame() {
    localStorage.removeItem('buzzwordsSave');
    foundWords.clear();
    totalScore = 0;
    window.location.href = window.location.href.split('?')[0] + '?nocache=' + Date.now();
}

initializeGame();