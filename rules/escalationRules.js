export function applyEscalation(state, config) {
  const profile = config.activeProfile;
  if (!profile) return;

  if (state.pressure >= 3) {
    state.resources.Suspicion += profile.escalationIntensity;
    state.pressure = Math.max(0, state.pressure - 3);
    state.log.push(`A pressao acumulada virou +${profile.escalationIntensity} Suspicion.`);
  }

  if (state.deferredEvents.length >= profile.deferralsBeforeApocalypse) {
    state.flags.apocalypseNear = true;
    state.log.push("Os adiamentos comecam a voltar com dentes.");
  }
}

export function canBrutalize(state, profile) {
  return state.brutalizedEvents < profile.brutalizeLimit;
}
