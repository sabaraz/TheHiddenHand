export function getCycleProfile(config, cycle) {
  return config.profiles
    .filter((profile) => cycle >= profile.minCycle)
    .reduce((active, profile) => ({ ...active, ...profile }), { ...config.defaults });
}

export function shouldReshuffle(state) {
  return state.deck.length === 0;
}

export function getPermanentEvents(events) {
  return events.filter((event) => ["persistent", "scalable", "apocalyptic"].includes(event.cycleBehavior));
}
