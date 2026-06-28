export const RESOURCE_NAMES = ["Money", "Food", "Cultists", "Prisoners", "Relics", "Suspicion"];

export function createInitialState() {
  return {
    resources: {
      Money: 3,
      Food: 3,
      Cultists: 2,
      Prisoners: 0,
      Relics: 0,
      Suspicion: 0
    },
    deck: [],
    discard: [],
    removed: [],
    mandatoryQueue: [],
    deferredEvents: [],
    deferredMandatoryEvents: [],
    upgradedEvents: {},
    brutalizedEvents: 0,
    runSeed: 0,
    cycle: 0,
    turn: 0,
    pressure: 0,
    currentEvent: null,
    lastEventId: null,
    ritual: null,
    selectedRitualId: null,
    flags: {},
    opportunitiesUsed: [],
    gameStatus: "playing",
    log: ["A porta do porao fecha por dentro."]
  };
}

export function cloneState(state) {
  return globalThis.structuredClone
    ? globalThis.structuredClone(state)
    : JSON.parse(JSON.stringify(state));
}

export function clampResources(resources) {
  for (const name of RESOURCE_NAMES) {
    resources[name] = Math.max(0, Number(resources[name] || 0));
  }
}
