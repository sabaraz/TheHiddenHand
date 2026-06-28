import { createInitialState, cloneState, clampResources } from "./initialState.js";
import { anticipateNextState } from "./anticipationResolver.js";
import { buildCycle, mixSeed, seededIndex } from "./cycleBuilder.js";
import { resolveEffects } from "./effectResolver.js";
import { getRitualCost, canAdvanceRitual } from "./ritualEngine.js";
import { getVisibleCost, hasResourcesForCost, payCost } from "../rules/costRules.js";
import { canBrutalize } from "../rules/escalationRules.js";
import { buildRequirement, isSelectionComplete } from "../rules/selectionModel.js";
import { validateEventPools } from "../data/validateEventPools.js";

export async function loadGameData() {
  const [eventPools, cycleConfig, rituals] = await Promise.all([
    fetch("./data/eventPools.json").then((response) => response.json()),
    fetch("./data/cycleProfiles.json").then((response) => response.json()),
    fetch("./data/rituals.json").then((response) => response.json())
  ]);

  const errors = validateEventPools(eventPools, rituals);
  if (errors.length > 0) {
    throw new Error(`eventPools validation failed:\n${errors.join("\n")}`);
  }

  const events = [...eventPools.events];
  const mandatoryEvents = [...eventPools.mandatory];
  const eventIndex = new Map([...events, ...mandatoryEvents].map((event) => [event.id, event]));

  return {
    events,
    mandatoryEvents,
    cycleConfig,
    rituals,
    getEventById(id) {
      return eventIndex.get(id);
    }
  };
}

export function createGame(context, savedState = null, options = {}) {
  const seedFactory = options.seedFactory || createRunSeed;
  const state = savedState ? normalizeLoadedState(savedState) : createInitialState();

  if (!savedState) {
    initializeRun(state, context, seedFactory());
  } else if (!state.currentEvent && state.gameStatus === "playing") {
    anticipateNextState(state, context);
  }

  return {
    getState() {
      return cloneState(state);
    },

    canChoose(choiceId) {
      const option = findChoice(state.currentEvent, choiceId);
      return option ? canPayOption(state, option, context) : false;
    },

    addLog(message) {
      if (message) {
        state.log.push(message);
      }
      return cloneState(state);
    },

    choose(choiceId, picks = null) {
      if (state.gameStatus !== "playing") return cloneState(state);
      const event = state.currentEvent;
      const option = findChoice(event, choiceId);

      if (!event || !option) {
        state.log.push("A escolha se perdeu antes de tocar a mesa.");
        return cloneState(state);
      }

      let paidCost = {};

      if (option.usesRitualCost) {
        // Ritual advance path: cost is paid internally by advanceRitual via payCost.
        if (!canPayOption(state, option, context)) {
          state.log.push("Recursos insuficientes para essa escolha.");
          return cloneState(state);
        }
      } else {
        // Player-selection path: debit exactly what the player picked.
        const cost = getChoiceCost(state, option, context);
        paidCost = cost;
        const requirement = buildRequirement(cost, Boolean(option.allowRelicSubstitution));
        if (requirement.length > 0) {
          if (!picks || !isSelectionComplete(requirement, picks, state.resources)) {
            state.log.push("Seleção de recursos inválida.");
            return cloneState(state);
          }
          const spent = [];
          for (const [r, count] of Object.entries(picks)) {
            if (count > 0) {
              state.resources[r] = Math.max(0, (state.resources[r] || 0) - count);
              spent.push(`${count} ${r}`);
            }
          }
          if (spent.length) state.log.push(`Gasto: ${spent.join(", ")}.`);
        }
      }

      state.turn += 1;
      state.lastEventId = event.id;
      state.currentEvent = null;
      state.log.push(`${event.title}: ${option.label}.`);
      resolveEffects(state, option.effects, context, { paidCost });
      resolveDestination(state, event, option, context);
      clampResources(state.resources);
      anticipateNextState(state, context);

      return cloneState(state);
    },

    restart() {
      const fresh = createInitialState();
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, fresh);
      initializeRun(state, context, seedFactory());
      return cloneState(state);
    },

    panic() {
      const resources = { ...state.resources };
      const ritual = state.ritual ? { ...state.ritual } : null;
      const selectedRitualId = state.selectedRitualId;
      const runSeed = nextRunSeed(state);
      const cycle = state.cycle;
      const turn = state.turn;

      state.deck = [];
      state.discard = [];
      state.removed = [];
      state.deferredEvents = [];
      state.deferredMandatoryEvents = [];
      state.mandatoryQueue = [];
      state.upgradedEvents = {};
      state.brutalizedEvents = 0;
      state.pressure = 0;
      state.currentEvent = null;
      state.lastEventId = null;
      state.opportunitiesUsed = [];
      state.flags = {};

      state.resources = resources;
      state.ritual = ritual;
      state.selectedRitualId = selectedRitualId;
      state.runSeed = runSeed;
      state.cycle = cycle;
      state.turn = turn;

      state.log.push("O pânico apagou o mapa. Recursos e progresso sobrevivem.");

      buildCycle(state, context.events, context.cycleConfig);
      anticipateNextState(state, context);
      return cloneState(state);
    }
  };
}

function createRunSeed() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(new Uint32Array(1))[0] >>> 0;
  }
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}

function nextRunSeed(state) {
  return mixSeed(state.runSeed, state.turn, state.cycle, state.log?.length || 0, 0x9E3779B9);
}

function initializeRun(state, context, runSeed) {
  state.runSeed = runSeed >>> 0;
  state.selectedRitualId = pickSeededRitualId(context.rituals, state.runSeed);
  buildCycle(state, context.events, context.cycleConfig);
  anticipateNextState(state, context);
}

function pickSeededRitualId(rituals, runSeed) {
  const ritualIds = Object.keys(rituals);
  return ritualIds[seededIndex(ritualIds.length, mixSeed(runSeed, 0xA11CE))] || null;
}

export function getChoiceCost(state, option, rituals) {
  return getVisibleCost(option, getRitualCost(state, rituals));
}

export function canPayOption(state, option, context) {
  const cost = getChoiceCost(state, option, context.rituals);
  if (option.usesRitualCost && !canAdvanceRitual(state, context.rituals, option)) return false;
  return hasResourcesForCost(state.resources, cost, Boolean(option.allowRelicSubstitution));
}

function findChoice(event, choiceId) {
  return event?.choices?.find((choice) => choice.id === choiceId);
}

function resolveDestination(state, event, option, context) {
  const isMandatory = event.kind === "mandatory";
  const explicitDestination = Boolean(option.destination);

  if (isMandatory && !explicitDestination) return;

  if (option.destination === "remove") {
    if (!state.removed.includes(event.id)) state.removed.push(event.id);
    return;
  }

  if (option.destination === "defer") {
    if (isMandatory) {
      state.deferredMandatoryEvents ||= [];
      if (!state.deferredMandatoryEvents.includes(event.id)) state.deferredMandatoryEvents.push(event.id);
    } else if (!state.deferredEvents.includes(event.id)) {
      state.deferredEvents.push(event.id);
    }
    return;
  }

  if (option.destination === "upgrade" && option.upgradeTo) {
    state.upgradedEvents[event.id] = option.upgradeTo;
    state.log.push(`${event.title} voltara como ${context.getEventById(option.upgradeTo)?.title || option.upgradeTo}.`);
    return;
  }

  if (option.destination === "brutalize" && option.upgradeTo) {
    const profile = context.cycleConfig.activeProfile || context.cycleConfig.defaults;
    if (canBrutalize(state, profile)) {
      state.brutalizedEvents += 1;
      state.upgradedEvents[event.id] = option.upgradeTo;
      state.log.push(`${event.title} foi brutalizado.`);
      return;
    }
    state.log.push("A brutalizacao tentou crescer, mas o ciclo ainda resiste.");
  }

  if (option.destination === "stabilize") {
    state.pressure = Math.max(0, state.pressure - 1);
    if (isMandatory) return;
  }

  if (option.destination === "return" && isMandatory) {
    state.log.push(`${event.title} voltara se o gatilho continuar ativo.`);
    return;
  }

  if (isMandatory) return;

  if (!state.discard.some((discarded) => discarded.id === event.id)) {
    state.discard.push(event);
  }
}

function normalizeLoadedState(state) {
  const loaded = { ...createInitialState(), ...state };
  loaded.resources = { ...createInitialState().resources, ...state.resources };
  loaded.deck = state.deck || [];
  loaded.discard = state.discard || [];
  loaded.removed = state.removed || [];
  loaded.mandatoryQueue = state.mandatoryQueue || [];
  loaded.deferredEvents = state.deferredEvents || [];
  loaded.deferredMandatoryEvents = state.deferredMandatoryEvents || [];
  loaded.upgradedEvents = state.upgradedEvents || {};
  loaded.flags = state.flags || {};
  loaded.opportunitiesUsed = state.opportunitiesUsed || [];
  loaded.selectedRitualId = state.selectedRitualId || null;
  loaded.runSeed = Number.isFinite(state.runSeed) ? state.runSeed >>> 0 : 0;
  loaded.log = state.log || [];
  return loaded;
}
