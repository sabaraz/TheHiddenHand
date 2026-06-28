// Central point for all gameStatus transitions.
// Only this function may write "won" or "lost" to state.gameStatus.
export function evaluateGameStatus(state) {
  if (state.gameStatus !== "playing") return;
  if (state.ritual?.status === "complete") {
    state.gameStatus = "won";
  }
}
