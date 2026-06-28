import { getCycleProfile, getPermanentEvents } from "../rules/reshuffleRules.js";
import { isOpportunityAvailable } from "../rules/opportunityRules.js";

// Maximum number of events per cycle. Limits cycle size without invalidating
// eligible events — it is a ceiling, not a forcing function.
export const MAX_CYCLE_SIZE = 10;

function scoreEvent(event, state, profile) {
  let score = event.tags.length;
  if (event.tags.includes("ritual") && state.ritual?.status === "active") score += 5;
  if (event.tags.includes("food") && state.resources.Food <= 2) score += 4;
  if (event.tags.includes("suspicion") && state.resources.Suspicion >= 3) score += 4;
  if (event.kind === "apocalyptic" && state.flags.apocalypseNear) score += 6;
  if (event.cycleBehavior === "scalable") score += profile.escalationIntensity;
  return score;
}

function createSeededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mixSeed(...values) {
  let hash = 0x811C9DC5;
  for (const value of values) {
    hash ^= Number(value || 0) >>> 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function seededIndex(length, seed) {
  if (length <= 0) return -1;
  return Math.floor(createSeededRandom(seed)() * length);
}

export function seededRandom(seed) {
  return createSeededRandom(seed)();
}

// Mulberry32 seeded PRNG - deterministic and reproducible for tests.
// Pass the same seed to get the same shuffle order.
export function seededShuffle(arr, seed) {
  const rand = createSeededRandom(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function uniqueById(events) {
  return [...new Map(events.map((event) => [event.id, event])).values()];
}

// Returns false only when a path is set AND the event belongs to a different path.
// Events with no ritualPath field are global and always pass.
export function matchesRitualPath(event, ritualPath) {
  if (!ritualPath) return true;
  if (!event.ritualPath) return true;
  return event.ritualPath === ritualPath;
}

export function buildCycle(state, allEvents, cycleConfig) {
  state.cycle += 1;
  const activeProfile = getCycleProfile(cycleConfig, state.cycle);
  cycleConfig.activeProfile = activeProfile;

  const relicCount = state.resources.Relics || 0;
  if (relicCount >= 2 && !state.flags.apocalypseNear) {
    const chaosThreshold = (relicCount - 1) * 0.15;
    if (seededRandom(mixSeed(state.runSeed, state.turn, state.cycle, 0xC0A05)) < chaosThreshold) {
      state.flags.apocalypseNear = true;
      state.log.push("O acúmulo de objetos antigos parece atrair atenção indesejada.");
    }
  }

  const upgradedEventIds = Object.values(state.upgradedEvents);
  const ritualPath = state.flags?.ritualPath ?? null;

  const available = allEvents
    .filter((event) => !state.removed.includes(event.id))
    .filter((event) => isOpportunityAvailable(state, event))
    .filter((event) => !event.requiresActiveRitual || state.ritual?.status === "active")
    .filter((event) => event.kind !== "apocalyptic" || state.flags.apocalypseNear || upgradedEventIds.includes(event.id))
    .filter((event) => matchesRitualPath(event, ritualPath))
    .map((event) =>
      state.upgradedEvents[event.id]
        ? allEvents.find((candidate) => candidate.id === state.upgradedEvents[event.id]) || event
        : event
    );

  const permanent = getPermanentEvents(available)
    .sort((a, b) => scoreEvent(b, state, activeProfile) - scoreEvent(a, state, activeProfile))
    .slice(0, activeProfile.persistentPerCycle);

  // Conservative floor of 2 discardable events per cycle. Project owner can
  // remove Math.max(..., 2) later to fully defer to profile minimums.
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

  // Shuffle the non-deferred pool so cycle order follows this run's seed.
  // Deferred events always lead so players see them first.
  const pool = uniqueById([...permanent, ...discardable, ...ritual]);
  const shuffled = seededShuffle(pool, mixSeed(state.runSeed, state.turn, state.cycle));
  const newDeck = uniqueById([...deferred, ...shuffled]).slice(0, MAX_CYCLE_SIZE);

  state.deck = newDeck;
  state.discard = [];
  state.log.push(`Ciclo ${state.cycle}: ${activeProfile.name}. ${state.deck.length} eventos preparados.`);
}
