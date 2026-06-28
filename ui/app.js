import { loadGameData, createGame } from "../engine/gameEngine.js";
import { render } from "./render.js";
import { saveGame, loadGame, clearGame } from "../storage/saveManager.js";
import { emptyPicks, picksFromIds, isSelectionComplete } from "../rules/selectionModel.js";

let context;
let game;

// In-progress resource picks. Separate from game state — never mutates resources.
// { pickedIds: Set<string> } | null   (instance IDs like "Money:2", "Food:0")
let selection = null;

// Tracks the last cycle rendered so the transition animation fires exactly once
// per new cycle, regardless of how many draw() calls happen within a cycle.
// Starts at 0 so the first cycle (cycle = 1 on new game) does not trigger animation.
let lastRenderedCycle = 0;

init();

async function init() {
  context = await loadGameData();
  bindStartScreen();
  bindMenu();
}

function bindStartScreen() {
  document.querySelector("#start-new-run").addEventListener("click", () => {
    clearGame();
    game = createGame(context, null);
    game.addLog("Nova partida iniciada.");
    showGameScreen();
    draw();
  });

  document.querySelector("#start-load").addEventListener("click", () => {
    const saved = loadGame();
    if (saved) {
      game = createGame(context, saved);
      game.addLog("Partida carregada.");
      showGameScreen();
      draw();
    } else {
      setStartMessage("Nenhuma partida salva encontrada.");
    }
  });
}

function bindMenu() {
  const overlay = document.querySelector("#menu-overlay");
  const menuBtn = document.querySelector("#menu-btn");
  const menuClose = document.querySelector("#menu-close");

  menuBtn.addEventListener("click", () => {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
  });

  function closeMenu() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    setMenuMessage("");
  }

  menuClose.addEventListener("click", closeMenu);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMenu();
  });

  document.querySelector("#menu-save").addEventListener("click", () => {
    if (!game) { setMenuMessage("Nenhuma partida ativa."); return; }
    saveGame(game.getState());
    game.addLog("Partida salva.");
    closeMenu();
    draw();
  });

  document.querySelector("#menu-new-run").addEventListener("click", () => {
    clearGame();
    game = createGame(context, null);
    game.addLog("Nova partida iniciada.");
    closeMenu();
    showGameScreen();
    draw();
  });

  document.querySelector("#menu-load").addEventListener("click", () => {
    const saved = loadGame();
    if (saved) {
      game = createGame(context, saved);
      game.addLog("Partida carregada.");
      closeMenu();
      showGameScreen();
      draw();
    } else {
      setMenuMessage("Nenhuma partida salva encontrada.");
    }
  });

  document.querySelector("#panic-reset").addEventListener("click", () => {
    if (!game) { setMenuMessage("Nenhuma partida ativa."); return; }
    game.panic();
    game.addLog("Botao do panico acionado.");
    saveGame(game.getState());
    closeMenu();
    draw();
  });

  document.querySelector("#panic-quick").addEventListener("click", () => {
    if (!game) return;
    game.panic();
    game.addLog("Botao do panico acionado.");
    saveGame(game.getState());
    draw();
  });
}

function showGameScreen() {
  const startScreen = document.querySelector("#start-screen");
  startScreen.classList.add("is-dismissed");
  startScreen.setAttribute("aria-hidden", "true");
  startScreen.hidden = true;
  document.querySelector("#game-screen").removeAttribute("hidden");
}

function setStartMessage(msg) {
  document.querySelector("#start-message").textContent = msg;
}

function setMenuMessage(msg) {
  document.querySelector("#menu-message").textContent = msg;
}

function showCycleTransition(cycle) {
  const overlay = document.querySelector("#cycle-overlay");
  if (!overlay) return;
  document.querySelector("#cycle-overlay-num").textContent = cycle;
  document.querySelector("#cycle-overlay-name").textContent =
    context.cycleConfig?.activeProfile?.name ?? "";
  overlay.setAttribute("aria-hidden", "false");
  overlay.classList.remove("is-active");
  overlay.offsetWidth; // force reflow to restart the animation
  overlay.classList.add("is-active");
  setTimeout(() => {
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
  }, 6000);
}

function draw(hint = null) {
  const state = game.getState();

  if (state.cycle > lastRenderedCycle && lastRenderedCycle > 0) {
    showCycleTransition(state.cycle);
  }
  lastRenderedCycle = state.cycle;

  const handlers = {
    // Player opens an event card — make the hand interactive immediately.
    onEventOpen() {
      selection = { pickedIds: new Set() };
      draw();
    },

    onEventClose() {
      selection = null;
      draw();
    },

    // Player clicks a paid choice: commit only if the current hand selection pays it.
    onSelectChoice(choiceId, requirement) {
      const picks = picksFromIds(selection?.pickedIds ?? new Set());
      if (!isSelectionComplete(requirement, picks, state.resources)) return;
      selection = null;
      game.choose(choiceId, picks);
      saveGame(game.getState());
      draw();
    },

    // Zero-cost (or ritual) choice: commit only with an empty hand selection.
    onDirectChoice(choiceId) {
      if ((selection?.pickedIds.size ?? 0) > 0) return;
      selection = null;
      game.choose(choiceId, emptyPicks());
      saveGame(game.getState());
      draw();
    },

    // Player toggles a specific resource card instance. cardId = "Money:2", "Food:0", etc.
    onPickResource(cardId) {
      if (!selection) return;
      const next = new Set(selection.pickedIds);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      selection = { pickedIds: next };
      draw("pick");
    },

    // Kept as safe fallback; not wired to any visible button.
    onConfirm() {
      draw();
    },

    // Cancel the in-progress selection.
    onCancelSelection() {
      selection = null;
      draw();
    },

    onRestart() {
      selection = null;
      clearGame();
      game = createGame(context, null);
      game.addLog("Nova partida iniciada.");
      saveGame(game.getState());
      draw();
    }
  };

  render(state, context, handlers, selection, hint);
}
