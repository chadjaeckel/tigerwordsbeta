// ===============================
// commands.js — Simplified Version
// Voice command parsing using a
// single unified synonym map.
// ===============================

const Commands = (() => {

  // ----------------------------------------------------------
  // 1. Normalize text into a predictable form
  // ----------------------------------------------------------
  function normalize(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "");  // strip punctuation
  }

  // ----------------------------------------------------------
  // 2. Synonym map for commands
  //    Add/remove phrases here to expand voice support.
  // ----------------------------------------------------------
  const COMMAND_SYNONYMS = {
    read_grid: [
      "read grid", "read letters", "say the letters",
      "what are the letters", "read the grid"
    ],
    hint: [
      "hint", "give me a hint", "help me",
      "clue", "i need a hint"
    ],
    repeat: [
      "repeat", "say that again", "what did you say",
      "repeat that", "repeat message"
    ],
    read_found_words: [
      "found words", "list words", "list found words",
      "read found words", "read my words",
      "say all words i found", "what have i found",
      "what words have i found", "what words did i find",
      "tell me my words", "read my found words"
    ],
    read_remaining_words: [
      "how many words are left", "how many words left",
      "words remaining", "what words are left",
      "how many do i have left", "read remaining words",
      "tell me whats left", "tell me what is left"
    ]
  };

  // ----------------------------------------------------------
  // 3. Try to detect if text matches a command
  // ----------------------------------------------------------
  function matchCommand(text) {
    for (const [command, phrases] of Object.entries(COMMAND_SYNONYMS)) {
      for (const phrase of phrases) {
        if (text.includes(phrase)) {
          return { type: command };
        }
      }
    }
    return null;
  }

  // ----------------------------------------------------------
  // 4. Guess detection:
  //    If the user says a single alphabetical word, treat it
  //    as a guess. This is how your original code worked.
  // ----------------------------------------------------------
  function detectGuess(text) {
    // Remove spaces / junk and see if we get a clean word.
    const cleaned = text.replace(/[^a-z]/g, "");
    if (cleaned.length >= 3) {
      return { type: "guess", payload: cleaned };
    }
    return null;
  }

  // ----------------------------------------------------------
  // 5. Main parse() method
  // ----------------------------------------------------------
  function parse(rawText) {
    if (!rawText) return { type: "unknown" };

    const text = normalize(rawText);

    // Priority order:
    // 1. Explicit commands
    const cmd = matchCommand(text);
    if (cmd) return cmd;

    // 2. Dictionary-style guess
    const guess = detectGuess(text);
    if (guess) return guess;

    // 3. Fallback
    return { type: "unknown", raw: text };
  }

  return { parse };
})();