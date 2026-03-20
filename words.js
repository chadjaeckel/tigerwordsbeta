// ===============================
// words.js
// Loads the dictionary from words.txt
// Provides WORD_LIST and WORDS_READY
// ===============================

// Global list used by puzzle.js and game.js
const WORD_LIST = [];

// Promise that resolves when the word list is fully loaded
const WORDS_READY = fetch("words.txt")
  .then(response => response.text())
  .then(text => {
    const lines = text.split(/\r?\n/);

    for (let word of lines) {
      word = word.trim().toLowerCase();

      const WORD_LIST = [];

const WORDS_READY = fetch("words.txt")
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load words.txt: ${response.status}`);
    }
    return response.text();
  })
  .then(text => {
    const lines = text.split(/\r?\n/);

    for (let word of lines) {
      word = word.trim().toLowerCase();

      if (word.length >= 4 && /^[a-z]+$/.test(word)) {
        WORD_LIST.push(word);
      }
    }

    console.log("Loaded words:", WORD_LIST.length);
  })
  .catch(err => {
    console.error("Error loading words.txt:", err);
  });
  

      // Basic filtering — adjust as needed
      if (word.length >= 4 && /^[a-z]+$/.test(word)) {
        WORD_LIST.push(word);
      }
    }

    console.log("Loaded words:", WORD_LIST.length);
  })
  .catch(err => {
    console.error("Error loading words.txt:", err);
  });
