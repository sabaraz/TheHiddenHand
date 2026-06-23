import { loadGameData, createGame } from "../engine/gameEngine.js";
import { render } from "./render.js";
import { saveGame, loadGame, clearGame } from "../storage/saveManager.js";

let context;
let game;

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

function draw() {
  const state = game.getState();

  render(state, context, {
    onChoice(choiceId) {
      game.choose(choiceId);
      saveGame(game.getState());
      draw();
    },
    onRestart() {
      clearGame();
      game = createGame(context, null);
      game.addLog("Nova partida iniciada.");
      saveGame(game.getState());
      draw();
    }
  });
}
