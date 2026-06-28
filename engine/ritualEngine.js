import { hasResourcesForCost, payCost } from "../rules/costRules.js";

export function startRitual(state, rituals, ritualId) {
  if (state.ritual?.status === "active") {
    state.log.push("O ritual ativo absorve o novo chamado.");
    return;
  }

  const template = rituals[ritualId];
  state.ritual = {
    id: template.id,
    name: template.name,
    description: template.description,
    stageIndex: 0,
    stageProgress: 0,
    failures: 0,
    failureLimit: template.failureLimit,
    status: "active"
  };
  state.log.push(`Ritual iniciado: ${template.name}.`);
}

export function getActiveStage(state, rituals) {
  if (!state.ritual || state.ritual.status !== "active") return null;
  return rituals[state.ritual.id].stages[state.ritual.stageIndex] || null;
}

export function getRitualCost(state, rituals) {
  return getActiveStage(state, rituals)?.advanceCost || {};
}

export function canAdvanceRitual(state, rituals, option) {
  if (!option.usesRitualCost) return true;
  return hasResourcesForCost(state.resources, getRitualCost(state, rituals), option.allowRelicSubstitution);
}

export function advanceRitual(state, rituals, unsafe = false, skipCost = false) {
  const stage = getActiveStage(state, rituals);
  if (!stage) {
    state.log.push("Nao ha ritual ativo para avancar.");
    return;
  }

  if (!unsafe && !skipCost) {
    payCost(state.resources, stage.advanceCost, false);
  }

  state.ritual.stageProgress += unsafe ? 2 : 1;
  state.log.push(`Ritual: ${stage.name} avanca.`);

  if (state.ritual.stageProgress >= stage.requiredProgress) {
    state.ritual.stageIndex += 1;
    state.ritual.stageProgress = 0;
    const nextStage = getActiveStage(state, rituals);
    if (nextStage) {
      state.log.push(`Nova etapa ritual: ${nextStage.name}.`);
    } else {
      state.ritual.status = "complete";
      // Win transition delegated to evaluateGameStatus in anticipateNextState.
      state.log.push("O ritual final se fecha corretamente.");
    }
  }
}

export function failRitual(state, rituals) {
  const stage = getActiveStage(state, rituals);
  if (!state.ritual || state.ritual.status !== "active") return;

  state.ritual.failures += 1;
  if (stage?.failurePenalty) {
    for (const [resource, amount] of Object.entries(stage.failurePenalty)) {
      state.resources[resource] = (state.resources[resource] || 0) + amount;
    }
  }

  // Each failure delays one progress point within the current stage.
  state.ritual.stageProgress = Math.max(0, state.ritual.stageProgress - 1);
  state.log.push("O ritual falha e atrasa o progresso.");

  if (state.ritual.failures >= state.ritual.failureLimit) {
    state.ritual.status = "cancelled";
    state.log.push("As falhas acumuladas dissolvem o ritual. O caminho continua.");
  }
}

export function stabilizeRitual(state) {
  if (!state.ritual || state.ritual.status !== "active") return;
  state.ritual.failures = Math.max(0, state.ritual.failures - 1);
  state.pressure = Math.max(0, state.pressure - 1);
  state.log.push("O ritual estabiliza o ciclo por um instante.");
}
