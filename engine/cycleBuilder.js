import { getCycleProfile, getPermanentEvents } from "../rules/reshuffleRules.js";
import { isOpportunityAvailable } from "../rules/opportunityRules.js";

function scoreEvent(event, state, profile) {
  let score = event.tags.length;
  if (event.tags.includes("ritual") && state.ritual?.status === "active") score += 5;
  if (event.tags.includes("food") && state.resources.Food <= 2) score += 4;
  if (event.tags.includes("suspicion") && state.resources.Suspicion >= 3) score += 4;
  if (event.kind === "apocalyptic" && state.flags.apocalypseNear) score += 6;
  if (event.cycleBehavior === "scalable") score += profile.escalationIntensity;
  return score;
}

function rotate(list, amount) {
  if (!list.length) return list;
  const offset = amount % list.length;
  return list.slice(offset).concat(list.slice(0, offset));
}

function uniqueById(events) {
  return [...new Map(events.map((event) => [event.id, event])).values()];
}

export function buildCycle(state, allEvents, cycleConfig) {
  state.cycle += 1;
  const activeProfile = getCycleProfile(cycleConfig, state.cycle);
  cycleConfig.activeProfile = activeProfile;

  const relicCount = state.resources.Relics || 0;
  if (relicCount >= 2 && !state.flags.apocalypseNear) {
    const chaosThreshold = (relicCount - 1) * 0.15;
    if (Math.random() < chaosThreshold) {
      state.flags.apocalypseNear = true;
      state.log.push("O acúmulo de objetos antigos parece atrair atenção indesejada.");
    }
  }
  const upgradedEventIds = Object.values(state.upgradedEvents);

  const available = allEvents
    .filter((event) => !state.removed.includes(event.id))
    .filter((event) => isOpportunityAvailable(state, event))
    .filter((event) => !event.requiresActiveRitual || state.ritual?.status === "active")
    .filter((event) => event.kind !== "apocalyptic" || state.flags.apocalypseNear || upgradedEventIds.includes(event.id))
    .map((event) => state.upgradedEvents[event.id] ? allEvents.find((candidate) => candidate.id === state.upgradedEvents[event.id]) || event : event);

  const permanent = getPermanentEvents(available)
    .sort((a, b) => scoreEvent(b, state, activeProfile) - scoreEvent(a, state, activeProfile))
    .slice(0, activeProfile.persistentPerCycle);

  const discardableCount = Math.min(activeProfile.discardableMax, Math.max(activeProfile.discardableMin, 2));
  const discardable = available
    .filter((event) => event.cycleBehavior === "discardable" || event.cycleBehavior === "unique")
    .sort((a, b) => scoreEvent(b, state, activeProfile) - scoreEvent(a, state, activeProfile))
    .slice(0, discardableCount);

  const ritual = available
    .filter((event) => event.kind === "ritual")
    .slice(0, activeProfile.ritualEvents);

  const deferred = state.deferredEvents
    .map((id) => available.find((event) => event.id === id))
    .filter(Boolean);
  state.deferredEvents = [];

  const newDeck = uniqueById([...deferred, ...permanent, ...discardable, ...ritual]);
  state.deck = rotate(newDeck, state.turn + state.cycle);
  state.discard = [];
  state.log.push(`Ciclo ${state.cycle}: ${activeProfile.name}. ${state.deck.length} eventos preparados.`);
}
