// ===============================
// speech.js — Refactored Version
// Includes:
//  • Push-to-talk (spacebar)
//  • Speech synthesis queue (FIFO)
//  • Auto-restart recognition while space is held
//  • Beep cue instead of spoken "Listening"
//  • Clean state handling + no duplicate listeners
// ===============================

console.log("Loaded speech.js — live version with clearQueue()");

const Speech = (() => {

  let recognition = null;
  let isListening = false;
  let isSpeaking = false;
  let listenersAttached = false;

  // -----------------------------
  // SPEECH SYNTHESIS QUEUE
  // -----------------------------
  let ttsQueue = [];
  let ttsActive = false;

  function processQueue() {
    if (ttsActive) return;
    if (ttsQueue.length === 0) return;

    const text = ttsQueue.shift();
    ttsActive = true;

    // Stop any ongoing TTS before starting next item
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.7;
    utter.pitch = 0.9;
    utter.volume = 1;

    utter.onstart = () => {
      isSpeaking = true;
    };

    utter.onend = () => {
      isSpeaking = false;
      ttsActive = false;
      // Prevent audio clipping by introducing a small delay
      setTimeout(processQueue, 120);
    };

    utter.onerror = () => {
      isSpeaking = false;
      ttsActive = false;
      setTimeout(processQueue, 120);
    };

    speechSynthesis.speak(utter);
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    ttsQueue.push(text);
    processQueue();
  }

  function clearQueue() {
    ttsQueue = [];
    ttsActive = false;

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      isSpeaking = false;
    }
  }

  // -----------------------------
  // AUDIO BEEP CUE
  // -----------------------------
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 900;   // High beep
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Beep failed:", e);
    }
  }

  // -----------------------------
  // START RECOGNITION
  // -----------------------------
  function startRecognition(callback) {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      speak("Speech recognition is not supported on this browser.");
      return;
    }

    // Stop all queued/output speech before listening
    clearQueue();

    recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();
      callback(text);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      isListening = false;

      if (window.__speechHoldSpace) {
        setTimeout(() => startRecognition(callback), 70);
      }
    };

    try {
      recognition.start();
      isListening = true;
      playBeep();
    } catch (e) {
      console.warn("Recognition start error:", e);
    }
  }

  // -----------------------------
  // STOP RECOGNITION
  // -----------------------------
  function stopRecognition() {
    window.__speechHoldSpace = false;

    if (recognition) {
      try {
        recognition.onend = null;
        recognition.stop();
      } catch (e) {
        console.warn("Recognizer stop error:", e);
      }
      recognition = null;
    }

    isListening = false;
  }

  // -----------------------------
  // PUSH-TO-TALK (Spacebar)
  // -----------------------------
  function pushToTalk(callback) {
    if (listenersAttached) return;
    listenersAttached = true;

    document.addEventListener("keydown", (e) => {
      if (e.code !== "Space") return;
      if (e.repeat) return;
      if (isListening || isSpeaking) return;

      window.__speechHoldSpace = true;
      startRecognition(callback);
    });

    document.addEventListener("keyup", (e) => {
      if (e.code !== "Space") return;
      stopRecognition();
    });
  }

  // -----------------------------
  // EXPORT API
  // -----------------------------
  return {
    speak,
    clearQueue,
    pushToTalk,
    stopListening: stopRecognition
  };
})();