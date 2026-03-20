// =======================================
// puzzle.js — Unified Dictionary Version
// Uses: Dictionary.words (Set), Dictionary.isValidWord()
// =======================================

// Minimum word length
const MIN_WORD_LENGTH = 4;

// Minimum number of valid words a puzzle must have
const MIN_VALID_WORDS = 20;

/* ============================================================
   WORD VALIDATION
   ============================================================ */
function isValidWord(word, puzzle) {
  if (!word) return false;

  word = word.toLowerCase();

  // 1. Must be long enough
  if (word.length < MIN_WORD_LENGTH) return false;

  // 2. Must contain the required (center) letter
  if (!word.includes(puzzle.required)) return false;

  // 3. Must exist in the dictionary
  if (!Dictionary.isValidWord(word)) return false;

  // 4. Build puzzle letter frequency map
  const freq = {};
  puzzle.letters.forEach(ch => {
    freq[ch] = (freq[ch] || 0) + 1;
  });

  // 5. Check usage of letters in the guessed word
  const used = {};
  for (let ch of word) {
    if (!freq[ch]) return false; // forbidden letter
    used[ch] = (used[ch] || 0) + 1;
    if (used[ch] > freq[ch]) return false; // overuse
  }

  return true;
}

/* ============================================================
   FIND ALL VALID WORDS FOR A PUZZLE
   ============================================================ */
function findValidWords(puzzle) {
  const dict = Dictionary.words;

  if (!dict || dict.size === 0) {
    console.warn("Dictionary is empty or not loaded yet.");
    return [];
  }

  const results = [];
  for (const word of dict) {
    if (isValidWord(word, puzzle)) {
      results.push(word);
    }
  }
  return results;
}

/* ============================================================
   SHUFFLE ARRAY (Fisher–Yates)
   ============================================================ */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================================================
   FILTER OUT OBSCURE BASE WORDS
   Same heuristic as your original version
   ============================================================ */
const COMMON_5 = new Set([
  "about", "after", "again", "below", "could", "every", "first",
  "found", "great", "house", "large", "learn", "never", "place",
  "plant", "point", "right", "small", "sound", "spell", "still",
  "study", "their", "there", "these", "thing", "think", "three",
  "water", "where", "which", "world", "would", "write"
]);

function hasCommonSubword(word) {
  for (let i = 0; i <= word.length - 5; i++) {
    const chunk = word.slice(i, i + 5);
    if (COMMON_5.has(chunk)) return true;
  }
  return false;
}

/* ============================================================
   GENERATE A PUZZLE FROM A 9‑LETTER BASE WORD
   ============================================================ */
function generatePuzzle() {
  const dict = Dictionary.words;

  if (!dict || dict.size === 0) {
    console.error("Dictionary not loaded — cannot generate puzzle.");
    return null;
  }

  // Build a list of 9‑letter base words
  const nineLetterWords = [];
  for (const w of dict) {
    if (w.length === 9) nineLetterWords.push(w);
  }

  if (nineLetterWords.length === 0) {
    console.error("No 9‑letter words available.");
    return null;
  }

  let attempts = 0;

  while (true) {
    attempts++;

    // Pick a random base word
    const baseWord = nineLetterWords[
      Math.floor(Math.random() * nineLetterWords.length)
    ];

    // Skip obscure words
    if (!hasCommonSubword(baseWord)) continue;

    // Shuffle letters
    const letters = shuffle(baseWord.split(""));

    // Required center letter
    const required = letters[4];

    // Build puzzle object
    const puzzle = {
      letters,
      required,
      centerIndex: 4,
      baseWord,
      validWords: []
    };

    // Validate words for this puzzle
    const valid = findValidWords(puzzle);

    // Only accept playable puzzles
    if (valid.length >= MIN_VALID_WORDS && valid.length <= 250) {
      puzzle.validWords = valid;
      console.log(
        `Puzzle accepted after ${attempts} tries: ${baseWord} (${valid.length} valid words)`
      );
      return puzzle;
    }
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */
window.generatePuzzle = generatePuzzle;
window.findValidWords = findValidWords;
window.Puzzle = {
  generatePuzzle,
  findValidWords
};