
// Simple localStorage-based persistence

const Storage = (() => {
  const KEY = "accessible_word_grid_players";

  function loadPlayers() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function savePlayers(players) {
    localStorage.setItem(KEY, JSON.stringify(players));
  }

  function upsertPlayer(player) {
    const players = loadPlayers();
    const idx = players.findIndex((p) => p.name === player.name);
    if (idx >= 0) {
      players[idx] = player;
    } else {
      players.push(player);
    }
    savePlayers(players);
  }

  return { loadPlayers, savePlayers, upsertPlayer };
})();
