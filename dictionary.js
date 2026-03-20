// Full dictionary loader for dynamic word validation

const Dictionary = (() => {
  let words = new Set();

  let commonNames = new Set([
    "john", "mary", "james", "robert", "smith",
    "jones", "michael", "linda", "david", "jennifer",
    "william", "elizabeth", "thomas", "sarah"
  ]);

  async function load() {
    try {
      const response = await fetch("words.txt");
      const text = await response.text();

      text.split(/\r?\n/).forEach(w => {
        w = w.trim().toLowerCase();
        if (w.length > 0) words.add(w);
      });

      console.log("Dictionary loaded:", words.size, "words");
    } catch (err) {
      console.error("Failed to load dictionary:", err);
    }
  }

  function isValidWord(word) {
    return words.has(word.toLowerCase());
  }

  function isCommonName(word) {
    return commonNames.has(word.toLowerCase());
  }

  return {
    load,
    isValidWord,
    isCommonName,
    get words() {
      return words;
    }
  };
})();
