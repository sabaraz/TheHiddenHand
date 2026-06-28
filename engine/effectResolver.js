import { clampResources } from "./initialState.js";
import { mixSeed, seededRandom } from "./cycleBuilder.js";
import { startRitual, advanceRitual, failRitual, stabilizeRitual } from "./ritualEngine.js";
import { markOpportunityUsed } from "../rules/opportunityRules.js";

export function resolveEffects(state, effects = [], context, resolution = {}) {
  for (const [effectIndex, effect] of effects.entries()) {
    if (effect.type === "resource") {
      if (
        effect.mirrorsCost === true &&
        effect.amount < 0 &&
        (resolution.paidCost?.[effect.resource] ?? 0) >= Math.abs(effect.amount)
      ) {
        continue;
      }
      state.resources[effect.resource] = (state.resources[effect.resource] || 0) + effect.amount;
    }

    if (effect.type === "pressure") {
      state.pressure += effect.amount;
    }

    if (effect.type === "flag") {
      state.flags[effect.flag] = effect.value;
    }

    if (effect.type === "opportunityUsed") {
      markOpportunityUsed(state, effect.eventId);
    }

    if (effect.type === "deferEvent") {
      if (!state.deferredEvents.includes(effect.eventId)) {
        state.deferredEvents.push(effect.eventId);
      }
    }

    if (effect.type === "startRitual") {
      startRitual(state, context.rituals, effect.ritualId);
    }

    if (effect.type === "startSelectedRitual") {
      const sourceEvent = context.getEventById?.(state.lastEventId);
      if (!state.flags.ritualPath) {
        const path = sourceEvent?.setsRitualPath;
        if (path) state.flags.ritualPath = path;
      }
      const ritualId = sourceEvent?.startsRitualId || state.selectedRitualId || "finalSummoning";
      startRitual(state, context.rituals, ritualId);
    }

    if (effect.type === "advanceRitualChance") {
      const chance = effect.successChance ?? 0.5;
      if (seededRandom(mixSeed(state.runSeed, state.turn, effectIndex, 0xADFACE)) < chance) {
        advanceRitual(state, context.rituals, false, true);
      } else {
        failRitual(state, context.rituals);
      }
    }

    if (effect.type === "advanceRitual") {
      advanceRitual(state, context.rituals, Boolean(effect.unsafe));
    }

    if (effect.type === "ritualFailure") {
      failRitual(state, context.rituals);
    }

    if (effect.type === "ritualStabilize") {
      stabilizeRitual(state);
    }

    if (effect.type === "stabilizeCycle") {
      state.pressure = Math.max(0, state.pressure - effect.amount);
      state.resources.Suspicion = Math.max(0, state.resources.Suspicion - effect.amount);
    }

    if (effect.type === "defeat") {
      state.gameStatus = "lost";
      state.log.push("Fim de linha. A cultua não sobrevive.");
    }
  }

  clampResources(state.resources);
}
