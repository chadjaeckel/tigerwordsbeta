// ===============================
// Accessible Word Grid — CLEAN FINAL game.js
// ===============================

// =============================================
// GLOBAL STATE
// =============================================
let gameState = null;

// Leaderboard storage
const leaderboardKey = "awgLeaderboard";
let leaderboard = [];

// Stats storage
const statsKey = "wordGridStats";
let stats = {
  gamesPlayed: 0,
  totalWordsFound: 0,
  totalPoints: 0
};

// =============================================
// SPEECH UTILITY: speakWithPause
// =============================================

// ===============================
// Speech wrappers
// ===============================
function startListening() {
  if (!gameState) {
    setStatus("Start a game before using voice commands.", true);
    return;
  }

  setStatus("Listening...");
  Speech.pushToTalk(text => {
    const result = Commands.parse(text);
    handleCommandResult(result, text);
  });
}

function stopListening() {
  Speech.stopListening();
  setStatus("Stopped listening.");
}

function speakWithPause(text) {
  Speech.speak(text);

  const pause = new SpeechSynthesisUtterance(" ");
  pause.volume = 0;
  pause.rate = 0.5;  // half-second pause
  pause.pitch = 1;
  speechSynthesis.speak(pause);
}

// =============================================
// LEADERBOARD FUNCTIONS
// =============================================
function loadLeaderboard() {
  try {
    const saved = localStorage.getItem(leaderboardKey);
    leaderboard = saved ? JSON.parse(saved) : [];
  } catch {
    leaderboard = [];
  }
}

function saveLeaderboard() {
  localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
}

function updateLeaderboardUI() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .forEach(entry => {
      const li = document.createElement("li");
      li.textContent = `${entry.name}: ${entry.score} pts — ${entry.time}s`;
      list.appendChild(li);
    });
}

// =============================================
// STATS FUNCTIONS
// =============================================
function loadStats() {
  try {
    const saved = localStorage.getItem(statsKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      stats.gamesPlayed = Number(parsed.gamesPlayed) || 0;
      stats.totalWordsFound = Number(parsed.totalWordsFound) || 0;
      stats.totalPoints = Number(parsed.totalPoints) || 0;
    }
  } catch {}
  updateStatsUI();
}

function saveStats() {
  try {
    localStorage.setItem(statsKey, JSON.stringify(stats));
  } catch {}
}

function updateStatsUI() {
  const container = document.getElementById("stats");
  if (!container) return;

  container.innerHTML = `
#### Statistics

Games Played: ${stats.gamesPlayed}
Total Words Found: ${stats.totalWordsFound}
Total Points: ${stats.totalPoints}
`;
}

// =============================================
// POINT SYSTEM
// =============================================
function calculatePoints(word) {
  const len = word.length;
  if (len === 4) return 4;
  if (len === 5) return 6;
  if (len === 6) return 8;
  if (len === 7) return 10;
  if (len === 8) return 15;
  if (len >= 9) return 25;
  return len;
}

// =============================================
// DOMContentLoaded — Load dictionary & stats
// =============================================
document.addEventListener("DOMContentLoaded", async () => {
  loadStats();
  loadLeaderboard();
  updateLeaderboardUI();

  const startBtn = document.getElementById("start-btn");
  startBtn.disabled = true;
  startBtn.textContent = "Loading dictionary...";

  await Dictionary.load();
  startBtn.disabled = false;
  startBtn.textContent = "Start Game";

  console.log("Dictionary ready:", Dictionary.words.size);
});

// =============================================
// HELPERS
// =============================================
function setStatus(message, speak = false) {
  const status = document.getElementById("status");
  status.textContent = message;

  if (speak) Speech.speak(message);
}


function isTypingTarget(target) {
  return (
    target &&
    (target.tagName === "INPUT" ||
     target.tagName === "TEXTAREA" ||
     target.isContentEditable)
  );
}

function updateRemainingCounter() {
  if (!gameState || !gameState.puzzle) return;

  const remaining = gameState.puzzle.validWords.filter(
    w => !gameState.foundWords.has(w)
  );
  const box = document.getElementById("remaining-counter");
  if (box) box.textContent = `Remaining words: ${remaining.length}`;
}

// ===============================
// Levenshtein Distance
// ===============================
function levenshtein(a, b) {
  const dp = Array(a.length + 1).fill(null).map(() =>
    Array(b.length + 1).fill(null)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

// ===============================
// Simple metaphone
// ===============================
function metaphone(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return "";
  const vowels = "aeiou";
  let result = "";
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    if (vowels.includes(c)) {
      if (i === 0) result += c;
      continue;
    }
    if ("bcdgptvqxz".includes(c)) result += c;
  }
  return result;
}

// ===============================
// Smart Guess
// ===============================
function smartGuess(word, validWords) {
  if (validWords.includes(word)) return word;

  const targetMeta = metaphone(word);
  const phoneticMatches = validWords.filter(
    w => metaphone(w) === targetMeta
  );
  if (phoneticMatches.length > 0) return phoneticMatches[0];

  let best = null;
  let bestDist = Infinity;
  validWords.forEach(w => {
    const d = levenshtein(word, w);
    if (d < bestDist) {
      bestDist = d;
      best = w;
    }
  });

  return bestDist <= 2 ? best : null;
}

//------------Part 2--------

// ===============================
// Found Words UI
// ===============================
function updateFoundWords() {
  const container = document.getElementById("found-words");
  container.innerHTML = "<h2>Found Words</h2>";

  const ul = document.createElement("ul");

  Array.from(gameState.foundWords)
    .sort()
    .forEach(word => {
      const li = document.createElement("li");
      li.textContent = word;
      ul.appendChild(li);
    });

  container.appendChild(ul);
}

// ===============================
// UI Update
// ===============================
function updateUI() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  gameState.puzzle.letters.forEach((ch, i) => {
    const cell = document.createElement("div");
    cell.className = "cell";

    if (i === gameState.puzzle.centerIndex) {
      cell.classList.add("center");
    }

    cell.textContent = ch.toUpperCase();
    grid.appendChild(cell);
  });

  const p1 = gameState.players[0];
  document.getElementById("p1-score").textContent =
    `${p1.name}: ${p1.score} points`;

  const p2Score = document.getElementById("p2-score");
  if (gameState.mode === "two") {
    const p2 = gameState.players[1];
    p2Score.hidden = false;
    p2Score.textContent = `${p2.name}: ${p2.score} points`;
  } else {
    p2Score.hidden = true;
    p2Score.textContent = "";
  }
}

// ===============================
// Handle Guess
// ===============================
function handleGuess(word) {
  word = word.trim().toLowerCase();
  if (!word) return;

  const valid = gameState.puzzle.validWords;

  // If not valid word
  if (!valid.includes(word)) {
    const maybe = smartGuess(word, valid);
    if (maybe) {
      setStatus(`Did you mean ${maybe}?`, true);
      return;
    }
    setStatus(`${word} is not valid.`, true);
    return;
  }

  // If already found
  if (gameState.foundWords.has(word)) {
    setStatus(`${word} was already found.`, true);
    return;
  }

  // Score word
  const points = calculatePoints(word);
  const player = gameState.players[gameState.currentPlayerIndex];
  player.score += points;

  // Update stats
  stats.totalWordsFound += 1;
  stats.totalPoints += points;
  saveStats();
  updateStatsUI();

  // Add word to found list
  gameState.foundWords.add(word);

  // 🔊 SPEAK CORRECT-WORD FEEDBACK
  if (points >= 15) {
    setStatus(`Amazing! ${word} earned ${points} points!`, true);
  } else {
    setStatus(`${word} is valid for ${points} points.`, true);
  }

  // Switch players in two-player mode
  if (gameState.mode === "two") {
    gameState.currentPlayerIndex =
      gameState.currentPlayerIndex === 0 ? 1 : 0;
  }

  // Update UI
  updateUI();
  updateFoundWords();
  updateRemainingCounter();
  updateProgressBar();

  // -----------------------------------------------
// SPEAK PLAYER NAME(S) AFTER GAME IS SET UP
// -----------------------------------------------
Speech.clearQueue();

if (mode === "single") {
  Speech.speak(`Welcome ${p1Name}. Let the hunt begin.`);
} else {
  Speech.speak(`Welcome ${p1Name} and ${p2Name}. Player one, you go first.`);
}

  checkForGameEnd();
}

// ===============================
// START GAME
// ===============================
document.getElementById("start-btn").addEventListener("click", () => {
  stats.gamesPlayed += 1;
  saveStats();
  updateStatsUI();

  const mode = document.querySelector("input[name='mode']:checked").value;
  const p1Name =
    document.getElementById("player1-name").value.trim() || "Player 1";
  const p2Name =
    document.getElementById("player2-name").value.trim() || "Player 2";

  const puzzle = Puzzle.generatePuzzle();

gameState = {
    puzzle,
    players: [
      { name: p1Name, score: 0 },
      { name: p2Name, score: 0 }
    ],
    mode,
    currentPlayerIndex: 0,
    foundWords: new Set(),
    startTime: Date.now()
};

// 🎤 Speak player name(s)
Speech.clearQueue();

if (mode === "single") {
  Speech.speak(`Welcome ${p1Name}. Let the hunt begin.`);
} else {
  Speech.speak(`Welcome ${p1Name} and ${p2Name}. Player one, you go first.`);
}
``

  console.log("DEBUG — GAMESTATE CREATED:", gameState);

  document.getElementById("p1-name-label").textContent = p1Name;
  document.getElementById("p2-name-label").textContent = p2Name;
  document.getElementById("p2-score-box").hidden = (mode !== "two");
  document.getElementById("game").hidden = false;

  updateUI();
  updateFoundWords();
  updateRemainingCounter();
  updateProgressBar();

  // ----------------------------------------------------
// GREET PLAYER(S) — WORKS 100% ON DESKTOP + MOBILE
// ----------------------------------------------------
setTimeout(() => {
  if (mode === "single") {
    Speech.speak(`Welcome ${p1Name}. Let the hunt begin.`);
  } else {
    Speech.speak(`Welcome ${p1Name} and ${p2Name}. Player one, you go first.`);
  }
}, 100); // small delay to allow speech engine to initialize

  // ----------------------------------------
// OPTIONAL WELCOME LINE + ROAR
// ----------------------------------------
Speech.clearQueue();
Speech.speak("Welcome to Game Tiger.");

// 2-second roar delay
setTimeout(() => {
  const roar = document.getElementById("tiger-roar");
  if (roar) {
    roar.currentTime = 0;
    roar.play().catch(() => {});
  }
}, 2000);

  // ----------------------------------------
  // SPEECH SEQUENCE AFTER STARTING A NEW GAME
  // ----------------------------------------
  // No automatic instructions at game start
// Prepare state for progress milestones
gameState.prowlSpoken = false;

// Focus typing field
// ===============================
// Start Game input focus (KEEP ONLY inside Start Game handler)
// ===============================
// ❌ removed duplicate typedInput here

});   // <-- THIS closes the start-btn click handler
``

// ===============================
// BUTTON HANDLERS
// ===============================
document.getElementById("hint-btn").addEventListener("click", giveHint);
document.getElementById("read-btn").addEventListener("click", readGridAloud);
document.getElementById("listen-btn").addEventListener("click", startListening);
document.getElementById("stop-btn").addEventListener("click", stopListening);
document.getElementById("endgame-btn").addEventListener("click", forceEndGame);

// RULES BUTTON
document.getElementById("rules-btn").addEventListener("click", () => {
  Speech.clearQueue();
  readRulesAndInstructions();
});

// READ INSTRUCTIONS BUTTON
document.getElementById("instructions-btn").addEventListener("click", () => {
  Speech.clearQueue();
  readKeyboardShortcuts();
});

// ===============================
// TYPED INPUT HANDLER
// ===============================
document.getElementById("typed-word").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    const word = e.target.value.trim().toLowerCase();
    e.target.value = "";
    handleGuess(word);
  }
});


// ===============================
// GLOBAL KEYDOWN SHORTCUTS
// ===============================
let spaceDown = false;

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  // R = Read Rules (unless typing into input box)
// R = Read Rules (BUT ONLY after the game has started)
if (key === "r") {

    // Prevent R from triggering during setup (typing usernames)
    if (!gameState) return;

    const typedInput = document.getElementById("typed-word");

    // If cursor is in the input box DURING the game, let user type "r"
    if (document.activeElement === typedInput) return;

    e.preventDefault();
    readRulesAndInstructions();
    return;
}

  // K = Keyboard shortcuts
  if (key === "k") {
    e.preventDefault();
    readKeyboardShortcuts();
    return;
  }

  // Allow only certain keys while typing
  if (isTypingTarget(e.target) && !["2", "3", "4"].includes(key)) return;

  // Push to talk
  if (e.code === "Space" && !spaceDown) {
    e.preventDefault();
    spaceDown = true;
    startListening();
    return;
  }

// 1 = Start Game
if (key === "1") {
  e.preventDefault();
  document.getElementById("start-btn").click();
  return;
}

// 2 = Read Letters
if (key === "2") {
  e.preventDefault();
  readGridAloud();
  return;
}

// 3 = End Game
if (key === "3") {
  e.preventDefault();
  forceEndGame();
  return;
}

// 4 = Focus typing box
if (key === "4") {
  e.preventDefault();
  const typedInput = document.getElementById("typed-word");
  typedInput.focus();
  typedInput.select();
  return;
}

// H = Help
if (key === "h") {
  e.preventDefault();
  openHelpModal();
  return;
}

});   // <-- END OF KEYDOWN HANDLER (this is correct)

/* NOTHING SHOULD BE HERE AFTER THE CLOSING }); */

document.addEventListener("keyup", (e) => {
  if (e.code === "Space" && spaceDown) {
    spaceDown = false;
    stopListening();
  }
});

// ===============================
// SPEAK KEYBOARD SHORTCUTS ON DEMAND
// ===============================
function readKeyboardShortcuts() {
  Speech.clearQueue();

  speakWithPause("Keyboard shortcuts.");
  speakWithPause("Press the letter R for rules and instructions.");
  speakWithPause("Or press the letter K to hear these keyboard shortcuts again.");
  speakWithPause("Press the number 1 to start a new game.");
  speakWithPause("Press the number 2 to read the letters.");
  speakWithPause("Press the number 3 to end the game now.");
  speakWithPause("Press Spacebar and hold to talk.");
  speakWithPause("Press Enter to submit a typed word.");
 
}

// ===============================
// Read Grid Aloud
// ===============================
function readGridAloud() {
  const letters = gameState.puzzle.letters.join(", ");
  const center = gameState.puzzle.required.toUpperCase();

  Speech.clearQueue();
  Speech.speak(`The letters are: ${letters}.`);
  Speech.speak(`Center letter is ${center}.`);
}

// ===============================
// Read Rules and Instructions
// ===============================
function readRulesAndInstructions() {
  Speech.clearQueue();

  // Game Goal
  Speech.speak("Game rules and instructions.");
  Speech.speak("Your goal is to find as many valid words as possible.");
  Speech.speak("Every word must include the center letter.");

  // How to Play
  Speech.speak("Here is how to play.");
  Speech.speak("Use the letters on the board to form words.");
  Speech.speak("Every word must be at least four letters long.");
  Speech.speak("You cannot reuse the same word twice.");
  Speech.speak("All words must be valid dictionary words.");

  // Scoring
  Speech.speak("Scoring.");
  Speech.speak("Longer words earn more points.");
  Speech.speak("Very long words earn bonus points.");

  // Controls
  Speech.speak("Controls.");
  Speech.speak("Type a word and press Enter.");
  Speech.speak("Press Space and hold to speak a word using your voice.");
  Speech.speak("Press two to hear the letters again.");
  Speech.speak("Press three to end the game at any time.");
  Speech.speak("Press four to move the cursor to the typing box.");

  // Ending
  Speech.speak("The game ends when you find all valid words.");
  Speech.speak("Or when you choose End Game Now.");
}

// ===============================
// Hint
// ===============================
// ===============================
// Improved Hint System
// ===============================
function giveHint() {
  const remaining = gameState.puzzle.validWords.filter(
    w => !gameState.foundWords.has(w)
  );

  if (remaining.length === 0) {
    setStatus("No words left.", true);
    return;
  }

  // ----------------------------------------------
  // 1) HINT TYPE: Count how many start with a letter
  // ----------------------------------------------
  const firstLetterCounts = {};
  remaining.forEach(word => {
    const first = word[0];
    firstLetterCounts[first] = (firstLetterCounts[first] || 0) + 1;
  });

  // Find a good letter to hint
  const bestLetter = Object.keys(firstLetterCounts)
    .sort((a, b) => firstLetterCounts[b] - firstLetterCounts[a])[0];

  const countForLetter = firstLetterCounts[bestLetter];

  // ----------------------------------------------
  // 2) HINT TYPE: A still‑missing long or interesting word length
  // ----------------------------------------------
  const lengthCounts = {};
  remaining.forEach(word => {
    const len = word.length;
    lengthCounts[len] = (lengthCounts[len] || 0) + 1;
  });

  // Choose a hint-worthy length (prefers long words)
  const bestLength = Object.keys(lengthCounts)
    .map(n => Number(n))
    .sort((a, b) => b - a)[0]; // longest remaining word length

  const countForLength = lengthCounts[bestLength];

  // ----------------------------------------------
  // Choose which hint to give (varied + fun)
  // ----------------------------------------------
  let message = "";

  // 50% chance: letter‑based hint
  if (Math.random() < 0.5) {
    if (countForLetter === 1) {
      message = `There is 1 word that starts with ${bestLetter.toUpperCase()}.`;
    } else {
      message = `There are ${countForLetter} words that start with ${bestLetter.toUpperCase()}.`;
    }
  }

  // 50% chance: length‑based hint
  else {
    if (countForLength === 1) {
      message = `There is a ${bestLength}-letter word you haven't found yet.`;
    } else {
      message = `There are ${countForLength} words with ${bestLength} letters you haven't found.`;
    }
  }

  setStatus(message, true);
}

// ===============================
// Command Parsing
// ===============================
function handleCommandResult(result, rawText) {
  switch (result.type) {
    case "guess":
      handleGuess(result.payload);
      break;

    case "read_grid":
      readGridAloud();
      break;

    case "hint":
      giveHint();
      break;

    case "repeat":
      setStatus(
        document.getElementById("status").textContent || "No status yet.",
        true
      );
      break;

    case "read_found_words":
      readFoundWordsAloud();
      break;

    case "read_remaining_words":
      readRemainingWords();
      break;

    default:
      setStatus(`I heard ${rawText}, but didn't understand.`, true);
  }
}

// ===============================
// Read Found Words Aloud
// ===============================
function readFoundWordsAloud() {
  const words = Array.from(gameState.foundWords).sort();

  if (words.length === 0) {
    setStatus("You have not found any words yet.", true);
    return;
  }

  setStatus(`You have found: ${words.join(", ")}.`, true);
}

// ===============================
// Read Remaining Words Aloud
// ===============================
function readRemainingWords() {
  const remaining = gameState.puzzle.validWords.filter(
    w => !gameState.foundWords.has(w)
  );

  if (remaining.length === 0) {
    setStatus("You have found all words.", true);
    return;
  }

  const counts = {};
  remaining.forEach(word => {
    const len = word.length;
    counts[len] = (counts[len] || 0) + 1;
  });

  const summary = Object.keys(counts)
    .sort((a, b) => Number(a) - Number(b))
    .map(len =>
      `${counts[len]} ${len}-letter ${counts[len] === 1 ? "word" : "words"}`
    )
    .join(", ");

  setStatus(
    `You have ${remaining.length} words remaining: ${summary}.`,
    true
  );
}

//--------Part 4----------

// ===============================
// END GAME NOW
// ===============================
function forceEndGame() {
  if (!gameState) {
    setStatus("No game in progress.", true);
    return;
  }

  const ok = confirm("Are you sure you want to end the game now?");
  if (!ok) return;

  openSummaryModal();
}

// ===============================
// END-GAME SUMMARY
// ===============================
function checkForGameEnd() {
  const remaining = gameState.puzzle.validWords.filter(
    w => !gameState.foundWords.has(w)
  );
  if (remaining.length === 0) openSummaryModal();
}

function openSummaryModal() {
  if (!gameState || !gameState.startTime) return;

  const modal = document.getElementById("summary-modal");
  const content = document.getElementById("summary-content");

  const p1 = gameState.players[0];
  const p2 = gameState.players[1];
  const durationSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);

  let html = `
    <p><strong>Total Words:</strong> ${gameState.puzzle.validWords.length}</p>
    <p><strong>You found all words!</strong></p>
    <p><strong>Time:</strong> ${durationSeconds} seconds</p>
    <hr />
    <p><strong>${p1.name}:</strong> ${p1.score} points</p>
  `;

  if (gameState.mode === "two") {
    html += `<p><strong>${p2.name}:</strong> ${p2.score} points</p>`;
  }

  content.innerHTML = html;

  // Add scores to leaderboard
  leaderboard.push({
    name: p1.name,
    score: p1.score,
    time: durationSeconds,
    date: Date.now()
  });

  if (gameState.mode === "two") {
    leaderboard.push({
      name: p2.name,
      score: p2.score,
      time: durationSeconds,
      date: Date.now()
    });
  }

  saveLeaderboard();
  updateLeaderboardUI();

  modal.hidden = false;

  // Confetti celebration
  if (typeof launchConfetti === "function") {
    launchConfetti();
  }

  // Spoken summary
  Speech.clearQueue();
  Speech.speak("Game complete.");
  Speech.speak(`${p1.name} scored ${p1.score} points.`);

  if (gameState.mode === "two") {
    Speech.speak(`${p2.name} scored ${p2.score} points.`);
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes > 0) {
    Speech.speak(`Total time played: ${minutes} minute${minutes === 1 ? "" : "s"} and ${seconds} second${seconds === 1 ? "" : "s"}.`);
  } else {
    Speech.speak(`Total time played: ${seconds} second${seconds === 1 ? "" : "s"}.`);
  }

  // WIN MESSAGE — PLAYER FOUND ALL WORDS
const remaining = gameState.puzzle.validWords.filter(
  w => !gameState.foundWords.has(w)
);

if (remaining.length === 0) {
  Speech.speak("You found every single word! The tiger reigns supreme! Do a little dance!");

}
}
document.getElementById("summary-close-btn").addEventListener("click", () => {
  document.getElementById("summary-modal").hidden = true;
});

// ===============================
// PROGRESS BAR
// ===============================
function updateProgressBar() {
  if (!gameState || !gameState.puzzle) return;

  const total = gameState.puzzle.validWords.length;
  const found = gameState.foundWords.size;

  const percent = Math.floor((found / total) * 100);

  // Update bar width
  const bar = document.getElementById("progress-bar");
  bar.style.width = percent + "%";

  // Update label
  const label = document.getElementById("progress-label");
  label.textContent = `${percent}% Complete`;

  // ================================
  // 🔊 50% PROGRESS ANNOUNCEMENT
  // ================================
  if (!gameState.prowlSpoken && percent >= 50) {
    gameState.prowlSpoken = true;    // prevent repeating
    Speech.clearQueue();
    Speech.speak("Ohh, tiger’s on the prowl!");
  }
}

// ===============================
// CONFETTI EFFECT
// ===============================
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const confetti = [];
  const colors = ["#ffeb3b", "#ff4081", "#7c4dff", "#40c4ff", "#69f0ae"];

  function createPiece() {
    return {
      x: Math.random() * canvas.width,
      y: -20,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 3 + 2
    };
  }

  for (let i = 0; i < 200; i++) {
    confetti.push(createPiece());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confetti.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.angle);
      p.angle += 0.02;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    if (performance.now() - startTime < 3000) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  const startTime = performance.now();
  animate();
}

// ===============================
// HELP POPUP
// ===============================
function openHelpModal() {
  const modal = document.getElementById("help-modal");
  modal.hidden = false;

  Speech.clearQueue();
  Speech.speak("Keyboard help.");
  Speech.speak("Press 1 to start a new game.");
  Speech.speak("Press 2 to read the letters.");
  Speech.speak("Press 3 to end the game now.");
  Speech.speak("Press space and hold to talk.");
  Speech.speak("Press enter to submit a typed word.");
  Speech.speak("Press H to open this help screen.");
  Speech.speak("Press R twice for game rules and instructions.");
}

function closeHelpModal() {
  document.getElementById("help-modal").hidden = true;
}

document.getElementById("help-close-btn").addEventListener("click", closeHelpModal);

// ===============================
// End of game.js
// ===============================