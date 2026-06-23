import { enqueueMandatoryEvents } from "../rules/mandatoryRules.js";
import { applyEscalation } from "../rules/escalationRules.js";
import { shouldReshuffle } from "../rules/reshuffleRules.js";
import { buildCycle } from "./cycleBuilder.js";

export function anticipateNextState(state, context) {
  if (state.gameStatus !== "playing") return;

  if (state.ritual?.status === "active") {
    state.pressure = Math.max(0, state.pressure - 1);
  }

  applyEscalation(state, context.cycleConfig);
  enqueueMandatoryEvents(state);

  if (state.mandatoryQueue.length > 0) {
    state.currentEvent = context.getEventById(state.mandatoryQueue.shift());
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
    enqueueMandatoryEvents(state);
    if (state.mandatoryQueue.length > 0) {
      state.currentEvent = context.getEventById(state.mandatoryQueue.shift());
      state.log.push(`Evento obrigatorio antes do ciclo: ${state.currentEvent.title}.`);
      return;
    }
  }

  state.currentEvent = state.deck.shift() || null;
  if (!state.currentEvent) {
    buildCycle(state, context.events, context.cycleConfig);
    state.currentEvent = state.deck.shift() || null;
  }
}
