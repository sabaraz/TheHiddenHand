import { enqueueMandatoryEvents, dequeueNextMandatory } from "../rules/mandatoryRules.js";
import { applyEscalation } from "../rules/escalationRules.js";
import { shouldReshuffle } from "../rules/reshuffleRules.js";
import { buildCycle } from "./cycleBuilder.js";
import { evaluateGameStatus } from "./gameStatus.js";

export function anticipateNextState(state, context) {
  evaluateGameStatus(state);
  if (state.gameStatus !== "playing") return;

  if (state.ritual?.status === "active") {
    state.pressure = Math.max(0, state.pressure - 1);
  }

  applyEscalation(state, context.cycleConfig);
  enqueueMandatoryEvents(state, context);

  const nextMandatory = dequeueNextMandatory(state, context);
  if (nextMandatory) {
    state.currentEvent = context.getEventById(nextMandatory);
    state.log.push(`Evento obrigatorio: ${state.currentEvent.title}.`);
    return;
  }

  if (state.deferredMandatoryEvents?.length > 0) {
    state.currentEvent = context.getEventById(state.deferredMandatoryEvents.shift());
    state.log.push(`Evento obrigatorio adiado: ${state.currentEvent.title}.`);
    return;
  }

  if (shouldReshuffle(state)) {
    buildCycle(state, context.events, context.cycleConfig);
    enqueueMandatoryEvents(state, context);
    const postReshuffleMandatory = dequeueNextMandatory(state, context);
    if (postReshuffleMandatory) {
      state.currentEvent = context.getEventById(postReshuffleMandatory);
      state.log.push(`Evento obrigatorio antes do ciclo: ${state.currentEvent.title}.`);
      return;
    }
  }

  state.currentEvent = state.deck.shift() || null;
  if (!state.currentEvent) {
    // No events passed all filters — controlled "no events" state, not a silent bug.
    state.log.push("Nenhum evento disponivel para este ciclo.");
  }
}
