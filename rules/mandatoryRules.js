const MANDATORY_BY_TRIGGER = [
  {
    id: "mandatory-starvation",
    shouldFire: (state) => state.resources.Food <= 0
  },
  {
    id: "mandatory-police-raid",
    shouldFire: (state) => state.resources.Suspicion >= 5
  },
  {
    id: "mandatory-greed",
    shouldFire: (state) => {
      const resourceTotal = Object.entries(state.resources)
        .filter(([name]) => name !== "Suspicion")
        .reduce((sum, [, value]) => sum + value, 0);
      return resourceTotal >= 15;
    }
  }
];

export function enqueueMandatoryEvents(state) {
  for (const rule of MANDATORY_BY_TRIGGER) {
    if (rule.shouldFire(state) && !state.mandatoryQueue.includes(rule.id) && state.currentEvent?.id !== rule.id) {
      state.mandatoryQueue.push(rule.id);
    }
  }
}
