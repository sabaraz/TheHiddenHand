import { evalTrigger } from "./triggerEvaluator.js";

function getActiveEntries(state, mandatoryEvents) {
  const ritualPath = state.flags?.ritualPath;
  return mandatoryEvents.filter((event) =>
    !event.mandatoryPath || event.mandatoryPath === ritualPath
  );
}

export function enqueueMandatoryEvents(state, context) {
  const events = context?.mandatoryEvents ?? [];
  for (const event of getActiveEntries(state, events)) {
    if (
      event.trigger &&
      evalTrigger(event.trigger, state) &&
      !state.mandatoryQueue.includes(event.id) &&
      state.currentEvent?.id !== event.id
    ) {
      state.mandatoryQueue.push(event.id);
    }
  }
}

export function dequeueNextMandatory(state, context) {
  const events = context?.mandatoryEvents ?? [];
  while (state.mandatoryQueue.length > 0) {
    const id = state.mandatoryQueue[0];
    const event = events.find((e) => e.id === id);
    if (!event || !event.trigger || evalTrigger(event.trigger, state)) {
      return state.mandatoryQueue.shift();
    }
    state.mandatoryQueue.shift(); // silently drop stale
  }
  return null;
}
