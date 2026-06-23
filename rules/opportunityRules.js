export function isOpportunityAvailable(state, event) {
  if (event.kind !== "opportunity") return true;
  return !state.opportunitiesUsed.includes(event.id) && !state.removed.includes(event.id);
}

export function markOpportunityUsed(state, eventId) {
  if (!state.opportunitiesUsed.includes(eventId)) {
    state.opportunitiesUsed.push(eventId);
  }
}
