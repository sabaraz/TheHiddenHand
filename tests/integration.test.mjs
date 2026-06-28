// Integration tests for the ritual path system, mandatory queue, and event pool corrections.
// Run with: node tests/integration.test.mjs

import { enqueueMandatoryEvents, dequeueNextMandatory } from "../rules/mandatoryRules.js";
import { resolveEffects } from "../engine/effectResolver.js";
import { matchesRitualPath, buildCycle, seededShuffle, MAX_CYCLE_SIZE } from "../engine/cycleBuilder.js";
import { evaluateGameStatus } from "../engine/gameStatus.js";
import { startRitual, failRitual } from "../engine/ritualEngine.js";
import { anticipateNextState } from "../engine/anticipationResolver.js";
import { createGame } from "../engine/gameEngine.js";
import { createInitialState } from "../engine/initialState.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventPools = JSON.parse(
  readFileSync(join(__dirname, "../data/eventPools.json"), "utf-8")
);

const rituals = JSON.parse(readFileSync(join(__dirname, "../data/rituals.json"), "utf-8"));
const cycleConfig = JSON.parse(readFileSync(join(__dirname, "../data/cycleProfiles.json"), "utf-8"));

const realContext = { mandatoryEvents: eventPools.mandatory };

// Shared context for effectResolver tests: indexes all events so getEventById
// resolves setsRitualPath from the actual JSON data.
const allEventIndex = new Map(
  [...eventPools.mandatory, ...eventPools.events].map((e) => [e.id, e])
);
const mockRituals = {
  finalSummoning: { id: "finalSummoning", stages: [] },
  hungerRite:     { id: "hungerRite",     stages: [] },
  signalPact:     { id: "signalPact",     stages: [] },
  eyeRite:        { id: "eyeRite",        stages: [] }
};
const effectContext = {
  rituals: mockRituals,
  getEventById: (id) => allEventIndex.get(id)
};

// ── Minimal test harness ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed += 1;
  } catch (e) {
    console.error(`  ✗  ${name}`);
    console.error(`       ${e.message}`);
    failed += 1;
  }
}

function assert(value, msg = "assertion failed") {
  if (!value) throw new Error(msg);
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function makeState(overrides = {}) {
  return {
    resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 0 },
    flags: {},
    mandatoryQueue: [],
    currentEvent: null,
    pressure: 0,
    lastEventId: null,
    ritual: null,
    deferredEvents: [],
    removed: [],
    log: [],
    gameStatus: "playing",
    ...overrides
  };
}

// Full context for cycle/anticipate tests. Clone cycleConfig per test to
// avoid activeProfile mutation bleeding between runs.
function makeCycleContext() {
  return {
    events: eventPools.events,
    mandatoryEvents: eventPools.mandatory,
    cycleConfig: JSON.parse(JSON.stringify(cycleConfig)),
    rituals,
    getEventById: (id) => allEventIndex.get(id)
  };
}

// ── Mandatory queue revalidation ──────────────────────────────────────────────

console.log("\nmandatory queue revalidation");

test("dequeueNextMandatory drops stale entry when trigger no longer true", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 2 } });
  state.mandatoryQueue = ["mandatory-police-raid"]; // trigger: Suspicion >= 5, but Suspicion is 2
  const result = dequeueNextMandatory(state, realContext);
  assertEqual(result, null, "should return null when entry is stale");
  assertEqual(state.mandatoryQueue.length, 0, "queue should be empty after dropping stale entry");
});

test("dequeueNextMandatory skips stale entries and returns first valid one", () => {
  const state = makeState({ resources: { Money: 5, Food: 0, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 2 } });
  // police-raid is stale (Suspicion < 5), starvation is valid (Food <= 0)
  state.mandatoryQueue = ["mandatory-police-raid", "mandatory-starvation"];
  const result = dequeueNextMandatory(state, realContext);
  assertEqual(result, "mandatory-starvation", "should skip stale and return first valid");
  assertEqual(state.mandatoryQueue.length, 0, "both entries consumed");
});

test("dequeueNextMandatory returns valid entry immediately without dropping", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 6 } });
  state.mandatoryQueue = ["mandatory-police-raid"];
  const result = dequeueNextMandatory(state, realContext);
  assertEqual(result, "mandatory-police-raid", "should return the valid entry");
  assertEqual(state.mandatoryQueue.length, 0);
});

// ── Trigger conditions ─────────────────────────────────────────────────────────

console.log("\ntrigger conditions");

test("mandatory-starvation fires when Food <= 0", () => {
  const state = makeState({ resources: { Money: 5, Food: 0, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 0 } });
  enqueueMandatoryEvents(state, realContext);
  assert(state.mandatoryQueue.includes("mandatory-starvation"), "starvation should be queued");
});

test("mandatory-police-raid fires when Suspicion >= 5", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 5 } });
  enqueueMandatoryEvents(state, realContext);
  assert(state.mandatoryQueue.includes("mandatory-police-raid"), "police-raid should be queued");
});

test("mandatory-greed fires when all resource sum >= 15", () => {
  // Sum: 5+3+2+0+0+5 = 15 — includes Suspicion
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 5 } });
  enqueueMandatoryEvents(state, realContext);
  assert(state.mandatoryQueue.includes("mandatory-greed"), "greed should be queued at sum 15");
});

test("mandatory-greed counts Suspicion toward the total", () => {
  // Sum without Suspicion: 4+2+2+0+0 = 8. With Suspicion: 8 + 7 = 15.
  const state = makeState({ resources: { Money: 4, Food: 2, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 7 } });
  enqueueMandatoryEvents(state, realContext);
  assert(state.mandatoryQueue.includes("mandatory-greed"), "Suspicion must count toward greed sum");
});

test("mandatory-greed does NOT fire when sum < 15", () => {
  const state = makeState({ resources: { Money: 2, Food: 2, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 0 } });
  enqueueMandatoryEvents(state, realContext);
  assert(!state.mandatoryQueue.includes("mandatory-greed"), "greed should not fire at sum 6");
});

// ── ritualPath lifecycle ────────────────────────────────────────────────────────

console.log("\nritualPath lifecycle");

test("ritualPath is undefined in fresh state", () => {
  const state = makeState();
  assertEqual(state.flags.ritualPath, undefined, "no ritualPath by default");
});

test("startSelectedRitual on famine-vision sets ritualPath to starvation", () => {
  const state = makeState({ lastEventId: "famine-vision" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.flags.ritualPath, "starvation", "famine-vision should set ritualPath to starvation");
});

test("startSelectedRitual on broadcast-vision sets ritualPath to broadcast", () => {
  const state = makeState({ lastEventId: "broadcast-vision" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.flags.ritualPath, "broadcast", "broadcast-vision should set ritualPath to broadcast");
});

test("startSelectedRitual on outer-vision sets ritualPath to outer", () => {
  const state = makeState({ lastEventId: "outer-vision" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.flags.ritualPath, "outer", "outer-vision should set ritualPath to outer");
});

test("ritualPath is not overwritten once set", () => {
  const state = makeState({ lastEventId: "outer-vision", flags: { ritualPath: "starvation" } });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.flags.ritualPath, "starvation", "first-set path must not be overwritten");
});

test("event without setsRitualPath does not define ritualPath", () => {
  // begging-bowl has no setsRitualPath field in the JSON
  const state = makeState({ lastEventId: "begging-bowl" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.flags.ritualPath, undefined, "no setsRitualPath on event must leave ritualPath undefined");
});

// ── Deck filtering by ritualPath ───────────────────────────────────────────────

console.log("\ndeck filtering by ritualPath");

test("matchesRitualPath: no path set → all events pass", () => {
  const starvation = { id: "forage-run", ritualPath: "starvation" };
  const global = { id: "begging-bowl" };
  assert(matchesRitualPath(starvation, null), "starvation event should pass when no path set");
  assert(matchesRitualPath(global, null), "global event should pass when no path set");
});

test("matchesRitualPath: path set → other-path events blocked", () => {
  const starvation = { id: "forage-run", ritualPath: "starvation" };
  const broadcast = { id: "viral-clip", ritualPath: "broadcast" };
  assert(matchesRitualPath(starvation, "starvation"), "matching path event should pass");
  assert(!matchesRitualPath(broadcast, "starvation"), "non-matching path event should be blocked");
});

test("matchesRitualPath: global events (no ritualPath field) always pass", () => {
  const global = { id: "begging-bowl" };
  assert(matchesRitualPath(global, "starvation"), "global event passes with starvation path");
  assert(matchesRitualPath(global, "broadcast"), "global event passes with broadcast path");
  assert(matchesRitualPath(global, "outer"), "global event passes with outer path");
});

// ── Thematic mandatory gating ──────────────────────────────────────────────────

console.log("\nthematic mandatory gating");

test("starvation thematic mandatories fire only when path is starvation", () => {
  // mandatory-famine-warn fires when Food <= 1
  const state = makeState({
    resources: { Money: 3, Food: 1, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 0 },
    flags: { ritualPath: "starvation" }
  });
  enqueueMandatoryEvents(state, realContext);
  assert(state.mandatoryQueue.includes("mandatory-famine-warn"), "famine-warn should queue with starvation path");
});

test("starvation thematic mandatories do NOT fire without matching path", () => {
  const state = makeState({
    resources: { Money: 3, Food: 1, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 0 },
    flags: { ritualPath: "broadcast" }
  });
  enqueueMandatoryEvents(state, realContext);
  assert(!state.mandatoryQueue.includes("mandatory-famine-warn"), "famine-warn must not queue under broadcast path");
});

// ── eventPools.json data corrections ──────────────────────────────────────────

console.log("\neventPools.json data corrections");

test("mandatory-notoriety/spotlight-fade upgradeTo is echo-chamber-brutal (not raid-brutal-broadcast)", () => {
  const notoriety = eventPools.mandatory.find((e) => e.id === "mandatory-notoriety");
  assert(notoriety, "mandatory-notoriety must exist");
  const fade = notoriety.choices.find((c) => c.id === "spotlight-fade");
  assert(fade, "spotlight-fade choice must exist");
  assertEqual(fade.upgradeTo, "echo-chamber-brutal", "upgradeTo must be echo-chamber-brutal");
});

test("tzeentch-gambit does not exist; shifting-wager exists with correct choice IDs", () => {
  const tzeentch = eventPools.events.find((e) => e.id === "tzeentch-gambit");
  assert(!tzeentch, "tzeentch-gambit must not exist");
  const wager = eventPools.events.find((e) => e.id === "shifting-wager");
  assert(wager, "shifting-wager must exist");
  const ids = wager.choices.map((c) => c.id);
  assert(ids.includes("wager-refuse"), "wager-refuse must exist");
  assert(ids.includes("wager-cautious"), "wager-cautious must exist");
  assert(ids.includes("wager-all-in"), "wager-all-in must exist");
});

test("return→defer: cellar-ignore destination is defer", () => {
  const cellar = eventPools.events.find((e) => e.id === "cellar-secret");
  assert(cellar, "cellar-secret must exist");
  const choice = cellar.choices.find((c) => c.id === "cellar-ignore");
  assert(choice, "cellar-ignore must exist");
  assertEqual(choice.destination, "defer", "cellar-ignore destination must be defer");
});

test("return→defer: fever-embrace destination is defer", () => {
  const plague = eventPools.events.find((e) => e.id === "plague-rumor-brutal");
  assert(plague, "plague-rumor-brutal must exist");
  const choice = plague.choices.find((c) => c.id === "fever-embrace");
  assert(choice, "fever-embrace must exist");
  assertEqual(choice.destination, "defer", "fever-embrace destination must be defer");
});

test("return→defer: trap-extreme destination is defer", () => {
  const echo = eventPools.events.find((e) => e.id === "echo-chamber-brutal");
  assert(echo, "echo-chamber-brutal must exist");
  const choice = echo.choices.find((c) => c.id === "trap-extreme");
  assert(choice, "trap-extreme must exist");
  assertEqual(choice.destination, "defer", "trap-extreme destination must be defer");
});

test("return→defer: bones-embrace destination is defer", () => {
  const famine = eventPools.events.find((e) => e.id === "famine-work-brutal");
  assert(famine, "famine-work-brutal must exist");
  const choice = famine.choices.find((c) => c.id === "bones-embrace");
  assert(choice, "bones-embrace must exist");
  assertEqual(choice.destination, "defer", "bones-embrace destination must be defer");
});

test("return→defer: loop-ride destination is defer", () => {
  const broadcast = eventPools.events.find((e) => e.id === "broadcast-work-brutal");
  assert(broadcast, "broadcast-work-brutal must exist");
  const choice = broadcast.choices.find((c) => c.id === "loop-ride");
  assert(choice, "loop-ride must exist");
  assertEqual(choice.destination, "defer", "loop-ride destination must be defer");
});

test("return→defer: procession-join destination is defer", () => {
  const parade = eventPools.events.find((e) => e.id === "panic-parade-brutal");
  assert(parade, "panic-parade-brutal must exist");
  const choice = parade.choices.find((c) => c.id === "procession-join");
  assert(choice, "procession-join must exist");
  assertEqual(choice.destination, "defer", "procession-join destination must be defer");
});

test("return→defer: shattered-feed destination is defer", () => {
  const outer = eventPools.events.find((e) => e.id === "outer-work-brutal");
  assert(outer, "outer-work-brutal must exist");
  const choice = outer.choices.find((c) => c.id === "shattered-feed");
  assert(choice, "shattered-feed must exist");
  assertEqual(choice.destination, "defer", "shattered-feed destination must be defer");
});

test("all 36 path events carry the correct ritualPath field", () => {
  const starvationIds = ["forage-run","soup-kitchen","black-market-hunger","plague-rumor","plague-rumor-brutal","cellar-secret","relic-in-the-pot","ledger-of-hunger","bone-lottery","famine-vision","famine-work","famine-work-brutal"];
  const broadcastIds = ["whisper-campaign","viral-clip","sponsored-ad","data-mining","pirated-feed","echo-chamber","echo-chamber-brutal","screenless-day","smoke-and-mirrors","broadcast-vision","broadcast-work","broadcast-work-brutal"];
  const outerIds = ["crawling-fog","blood-moon","relic-auction","panic-parade","panic-parade-brutal","mutation","plague-of-flies","wild-offering","shifting-wager","outer-vision","outer-work","outer-work-brutal"];

  for (const id of starvationIds) {
    const ev = eventPools.events.find((e) => e.id === id);
    assert(ev, `${id} must exist`);
    assertEqual(ev.ritualPath, "starvation", `${id} must have ritualPath starvation`);
  }
  for (const id of broadcastIds) {
    const ev = eventPools.events.find((e) => e.id === id);
    assert(ev, `${id} must exist`);
    assertEqual(ev.ritualPath, "broadcast", `${id} must have ritualPath broadcast`);
  }
  for (const id of outerIds) {
    const ev = eventPools.events.find((e) => e.id === id);
    assert(ev, `${id} must exist`);
    assertEqual(ev.ritualPath, "outer", `${id} must have ritualPath outer`);
  }
});

test("global events have no ritualPath field", () => {
  const globalIds = ["begging-bowl","market-whisper","street-sermon","cellar-door","relic-in-the-wall","ritual-dream","ritual-work","ledger-smoke","well-rumor","raid-brutal","well-rumor-brutal","ritual-work-brutal"];
  for (const id of globalIds) {
    const ev = eventPools.events.find((e) => e.id === id);
    assert(ev, `${id} must exist`);
    assertEqual(ev.ritualPath, undefined, `${id} must not have ritualPath (global event)`);
  }
});

// ── startsRitualId: vision events start specific rituals ──────────────────────

console.log("\nstartsRitualId: vision-initiated rituals");

test("famine-vision startSelectedRitual starts hungerRite", () => {
  const state = makeState({ lastEventId: "famine-vision" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.ritual?.id, "hungerRite", "famine-vision should start hungerRite");
});

test("broadcast-vision startSelectedRitual starts signalPact", () => {
  const state = makeState({ lastEventId: "broadcast-vision" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.ritual?.id, "signalPact", "broadcast-vision should start signalPact");
});

test("outer-vision startSelectedRitual starts eyeRite", () => {
  const state = makeState({ lastEventId: "outer-vision" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.ritual?.id, "eyeRite", "outer-vision should start eyeRite");
});

test("event without startsRitualId uses state.selectedRitualId as fallback", () => {
  const state = makeState({ lastEventId: "begging-bowl", selectedRitualId: "finalSummoning" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.ritual?.id, "finalSummoning", "should use selectedRitualId when event has no startsRitualId");
});

test("event without startsRitualId and no selectedRitualId falls back to finalSummoning", () => {
  const state = makeState({ lastEventId: "begging-bowl" });
  // selectedRitualId is undefined — not set in makeState
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.ritual?.id, "finalSummoning", "should fall back to finalSummoning when no selectedRitualId");
});

test("startsRitualId has priority over selectedRitualId", () => {
  const state = makeState({ lastEventId: "famine-vision", selectedRitualId: "finalSummoning" });
  resolveEffects(state, [{ type: "startSelectedRitual" }], effectContext);
  assertEqual(state.ritual?.id, "hungerRite", "startsRitualId must take priority over selectedRitualId");
});

// ── Declarative trigger: new mandatory without hardcoded rule ─────────────────

console.log("\ndeclarative trigger: new mandatory");

test("mandatory added only via JSON fires via evalTrigger without any hardcoded rule", () => {
  const syntheticEvent = {
    id: "mandatory-synthetic-test",
    kind: "mandatory",
    trigger: { resource: "Relics", op: ">=", value: 3 }
    // no mandatoryPath → global
  };
  const ctx = { mandatoryEvents: [syntheticEvent] };
  const state = makeState({ resources: { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 3, Suspicion: 0 } });
  enqueueMandatoryEvents(state, ctx);
  assert(state.mandatoryQueue.includes("mandatory-synthetic-test"),
    "synthetic mandatory should fire when Relics >= 3 without any hardcoded rule");
});

test("synthetic mandatory does NOT fire when trigger condition is false", () => {
  const syntheticEvent = {
    id: "mandatory-synthetic-test",
    kind: "mandatory",
    trigger: { resource: "Relics", op: ">=", value: 3 }
  };
  const ctx = { mandatoryEvents: [syntheticEvent] };
  const state = makeState({ resources: { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 2, Suspicion: 0 } });
  enqueueMandatoryEvents(state, ctx);
  assert(!state.mandatoryQueue.includes("mandatory-synthetic-test"),
    "synthetic mandatory must not fire when Relics < 3");
});

test("synthetic thematic mandatory only fires when mandatoryPath matches ritualPath", () => {
  const syntheticEvent = {
    id: "mandatory-synthetic-thematic",
    kind: "mandatory",
    trigger: { resource: "Relics", op: ">=", value: 1 },
    mandatoryPath: "outer"
  };
  const ctx = { mandatoryEvents: [syntheticEvent] };

  const outerState = makeState({
    resources: { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 1, Suspicion: 0 },
    flags: { ritualPath: "outer" }
  });
  enqueueMandatoryEvents(outerState, ctx);
  assert(outerState.mandatoryQueue.includes("mandatory-synthetic-thematic"),
    "should fire when ritualPath is outer");

  const broadcastState = makeState({
    resources: { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 1, Suspicion: 0 },
    flags: { ritualPath: "broadcast" }
  });
  enqueueMandatoryEvents(broadcastState, ctx);
  assert(!broadcastState.mandatoryQueue.includes("mandatory-synthetic-thematic"),
    "must not fire when ritualPath is broadcast");
});

test("dequeueNextMandatory with synthetic context drops stale synthetic entry", () => {
  const syntheticEvent = {
    id: "mandatory-synthetic-test",
    kind: "mandatory",
    trigger: { resource: "Relics", op: ">=", value: 3 }
  };
  const ctx = { mandatoryEvents: [syntheticEvent] };
  const state = makeState({ resources: { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 1, Suspicion: 0 } });
  state.mandatoryQueue = ["mandatory-synthetic-test"]; // queued but trigger is now false (Relics=1 < 3)
  const result = dequeueNextMandatory(state, ctx);
  assertEqual(result, null, "stale synthetic entry should be dropped");
  assertEqual(state.mandatoryQueue.length, 0);
});

// ── mirrorsCost: Suspicion debit deduplication ───────────────────────────────

console.log("\nmirrorsCost: Suspicion debit deduplication");

test("mirrorsCost: true skips effect when paidCost fully covers the amount", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 5 } });
  const effects = [{ type: "resource", resource: "Suspicion", amount: -3, mirrorsCost: true }];
  resolveEffects(state, effects, effectContext, { paidCost: { Suspicion: 3 } });
  assertEqual(state.resources.Suspicion, 5, "Suspicion should stay at 5 — effect skipped, cost already covered it");
});

test("mirrorsCost: without mirrorsCost flag, Suspicion effect applies normally even with paidCost present", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 5 } });
  const effects = [{ type: "resource", resource: "Suspicion", amount: -3 }];
  resolveEffects(state, effects, effectContext, { paidCost: { Suspicion: 3 } });
  assertEqual(state.resources.Suspicion, 2, "Suspicion should fall to 2 — no mirrorsCost, effect is not skipped");
});

test("mirrorsCost: true with insufficient paidCost still applies the full effect", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 5 } });
  const effects = [{ type: "resource", resource: "Suspicion", amount: -3, mirrorsCost: true }];
  resolveEffects(state, effects, effectContext, { paidCost: { Suspicion: 2 } }); // paid 2, need 3
  assertEqual(state.resources.Suspicion, 2, "Suspicion should fall — paidCost(2) < abs(-3), skip condition not met");
});

test("mirrorsCost: positive amount is never skipped regardless of paidCost", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 2 } });
  const effects = [{ type: "resource", resource: "Suspicion", amount: 3, mirrorsCost: true }];
  resolveEffects(state, effects, effectContext, { paidCost: { Suspicion: 3 } });
  assertEqual(state.resources.Suspicion, 5, "positive Suspicion effect must always apply");
});

test("mirrorsCost: no resolution object passed — mirrorsCost effect applies normally", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 5 } });
  const effects = [{ type: "resource", resource: "Suspicion", amount: -3, mirrorsCost: true }];
  resolveEffects(state, effects, effectContext); // no 4th arg
  assertEqual(state.resources.Suspicion, 2, "without resolution, mirrorsCost effect still applies normally");
});

test("mirrorsCost: only Suspicion is skipped; other effects in same call are unaffected", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 5 } });
  const effects = [
    { type: "resource", resource: "Suspicion", amount: -3, mirrorsCost: true },
    { type: "resource", resource: "Money", amount: -2 }
  ];
  resolveEffects(state, effects, effectContext, { paidCost: { Suspicion: 3 } });
  assertEqual(state.resources.Suspicion, 5, "Suspicion effect skipped");
  assertEqual(state.resources.Money, 3, "Money effect applied normally");
});

// ── evaluateGameStatus ────────────────────────────────────────────────────────

console.log("\nevaluateGameStatus: win/loss conditions");

test("ritual complete → gameStatus becomes won", () => {
  const state = makeState({ ritual: { status: "complete" } });
  evaluateGameStatus(state);
  assertEqual(state.gameStatus, "won", "completed ritual must set gameStatus to won");
});

test("pressure at 3 does NOT set gameStatus to lost", () => {
  const state = makeState({ pressure: 3 });
  evaluateGameStatus(state);
  assertEqual(state.gameStatus, "playing", "pressure >= 3 must not cause defeat");
});

test("ritual cancelled does NOT set gameStatus to lost", () => {
  const state = makeState({ ritual: { status: "cancelled", failures: 3, failureLimit: 3 } });
  evaluateGameStatus(state);
  assertEqual(state.gameStatus, "playing", "ritual cancellation must not cause defeat");
});

test("empty resources do NOT set gameStatus to lost", () => {
  const state = makeState({
    resources: { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 0, Suspicion: 0 }
  });
  evaluateGameStatus(state);
  assertEqual(state.gameStatus, "playing", "resource depletion must not cause defeat");
});

// ── ritualEngine: failure regression and cancellation ─────────────────────────

console.log("\nritualEngine: failure regression and cancellation");

test("failRitual regresses stageProgress by 1", () => {
  const state = makeState({
    ritual: { id: "finalSummoning", status: "active", stageIndex: 0, stageProgress: 1, failures: 0, failureLimit: 3 }
  });
  failRitual(state, rituals);
  assertEqual(state.ritual.stageProgress, 0, "stageProgress should regress from 1 to 0");
});

test("failRitual clamps stageProgress to 0 when already at 0", () => {
  const state = makeState({
    ritual: { id: "finalSummoning", status: "active", stageIndex: 0, stageProgress: 0, failures: 0, failureLimit: 3 }
  });
  failRitual(state, rituals);
  assertEqual(state.ritual.stageProgress, 0, "stageProgress must not go below 0");
});

test("failRitual at failureLimit cancels ritual (not lost)", () => {
  const state = makeState({
    ritual: { id: "twilightPact", status: "active", stageIndex: 0, stageProgress: 0, failures: 1, failureLimit: 2 }
  });
  failRitual(state, rituals);
  assertEqual(state.ritual.status, "cancelled", "ritual should be cancelled on last failure");
  assertEqual(state.gameStatus, "playing", "gameStatus must stay playing after cancellation");
});

test("cancelled ritual allows a new ritual to start", () => {
  const state = makeState({
    ritual: { id: "twilightPact", status: "cancelled", failures: 2, failureLimit: 2 }
  });
  startRitual(state, rituals, "finalSummoning");
  assertEqual(state.ritual.id, "finalSummoning", "new ritual can start after cancellation");
  assertEqual(state.ritual.status, "active", "new ritual status must be active");
});

// ── seededShuffle ─────────────────────────────────────────────────────────────

console.log("\nseededShuffle: determinism and variety");

test("same seed produces identical shuffle order", () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const a = seededShuffle([...arr], 42);
  const b = seededShuffle([...arr], 42);
  assertEqual(JSON.stringify(a), JSON.stringify(b), "same seed must produce identical order");
});

test("different seeds produce different shuffle order for arrays of sufficient length", () => {
  const arr = Array.from({ length: 20 }, (_, i) => i);
  const a = seededShuffle([...arr], 100);
  const b = seededShuffle([...arr], 999);
  assert(JSON.stringify(a) !== JSON.stringify(b), "different seeds must not produce identical order");
});

// ── buildCycle: cap, filters, removal ─────────────────────────────────────────

// -- runSeed -------------------------------------------------------------------

console.log("\nrunSeed: game identity and reproducible randomness");

test("buildCycle changes order by runSeed while keeping the same eligible set", () => {
  const baseState = createInitialState();
  baseState.runSeed = 111;
  buildCycle(baseState, eventPools.events, JSON.parse(JSON.stringify(cycleConfig)));
  const baseOrder = baseState.deck.map((e) => e.id);
  const baseSet = [...baseOrder].sort().join("|");

  let foundDifferentOrder = false;
  for (const seed of [222, 333, 444, 555, 666]) {
    const state = createInitialState();
    state.runSeed = seed;
    buildCycle(state, eventPools.events, JSON.parse(JSON.stringify(cycleConfig)));
    const order = state.deck.map((e) => e.id);
    assertEqual([...order].sort().join("|"), baseSet, "runSeed must not change the eligible event set");
    if (order.join("|") !== baseOrder.join("|")) foundDifferentOrder = true;
  }

  assert(foundDifferentOrder, "at least one alternate runSeed should change deck order");
});

test("createGame with the same injected runSeed reproduces ritual and deck order", () => {
  const gameA = createGame(makeCycleContext(), null, { seedFactory: () => 123456 });
  const gameB = createGame(makeCycleContext(), null, { seedFactory: () => 123456 });
  const stateA = gameA.getState();
  const stateB = gameB.getState();

  assertEqual(stateA.runSeed, 123456, "new game should store injected runSeed");
  assertEqual(stateB.runSeed, 123456, "second new game should store injected runSeed");
  assertEqual(stateA.selectedRitualId, stateB.selectedRitualId, "same runSeed should pick same ritual");
  assertEqual(stateA.currentEvent?.id, stateB.currentEvent?.id, "same runSeed should draw same first event");
  assertEqual(
    stateA.deck.map((e) => e.id).join("|"),
    stateB.deck.map((e) => e.id).join("|"),
    "same runSeed should preserve deck order"
  );
});

test("loaded games preserve saved runSeed instead of generating a new one", () => {
  const saved = createInitialState();
  saved.runSeed = 987654;
  saved.currentEvent = eventPools.events[0];

  const game = createGame(makeCycleContext(), saved, { seedFactory: () => 111111 });
  const state = game.getState();

  assertEqual(state.runSeed, 987654, "loaded game must keep saved runSeed");
});

test("restart creates a fresh runSeed through the seed factory", () => {
  const seeds = [1001, 2002];
  const game = createGame(makeCycleContext(), null, { seedFactory: () => seeds.shift() });
  const first = game.getState();
  const restarted = game.restart();

  assertEqual(first.runSeed, 1001, "initial game should use first seed");
  assertEqual(restarted.runSeed, 2002, "restart should use next seed");
});

test("panic derives a new deterministic runSeed from the current run", () => {
  const gameA = createGame(makeCycleContext(), null, { seedFactory: () => 424242 });
  const gameB = createGame(makeCycleContext(), null, { seedFactory: () => 424242 });
  const beforeSeed = gameA.getState().runSeed;
  const afterA = gameA.panic();
  const afterB = gameB.panic();

  assert(afterA.runSeed !== beforeSeed, "panic should replace the current runSeed");
  assertEqual(afterA.runSeed, afterB.runSeed, "panic seed should be deterministic for the same prototype state");
});

test("advanceRitualChance is reproducible for the same runSeed and turn", () => {
  const makeChanceState = () => ({
    ...createInitialState(),
    runSeed: 13579,
    turn: 4,
    ritual: { id: "finalSummoning", status: "active", stageIndex: 0, stageProgress: 0, failures: 0, failureLimit: 3 }
  });
  const stateA = makeChanceState();
  const stateB = makeChanceState();

  resolveEffects(stateA, [{ type: "advanceRitualChance", successChance: 0.5 }], { rituals });
  resolveEffects(stateB, [{ type: "advanceRitualChance", successChance: 0.5 }], { rituals });

  assertEqual(JSON.stringify(stateA.ritual), JSON.stringify(stateB.ritual), "same runSeed and turn should resolve chance identically");
});

console.log("\nbuildCycle: size cap, filters, removal");

test(`buildCycle produces at most ${MAX_CYCLE_SIZE} events`, () => {
  const state = createInitialState();
  buildCycle(state, eventPools.events, JSON.parse(JSON.stringify(cycleConfig)));
  assert(state.deck.length <= MAX_CYCLE_SIZE, `deck must be ≤ ${MAX_CYCLE_SIZE} cards, got ${state.deck.length}`);
});

test("buildCycle does not include removed events", () => {
  const state = createInitialState();
  const targetId = eventPools.events[0].id;
  state.removed = [targetId];
  buildCycle(state, eventPools.events, JSON.parse(JSON.stringify(cycleConfig)));
  assert(!state.deck.some((e) => e.id === targetId), "removed event must not appear in new cycle deck");
});

test("buildCycle respects ritualPath filter", () => {
  const state = createInitialState();
  state.flags.ritualPath = "starvation";
  buildCycle(state, eventPools.events, JSON.parse(JSON.stringify(cycleConfig)));
  const hasWrongPath = state.deck.some((e) => e.ritualPath && e.ritualPath !== "starvation");
  assert(!hasWrongPath, "deck must not contain events from a different ritualPath");
});

// ── anticipateNextState: game flow ────────────────────────────────────────────

console.log("\nanticipateNextState: game flow");

test("anticipateNextState sets won when ritual is complete", () => {
  const state = createInitialState();
  state.ritual = { id: "finalSummoning", status: "complete", failures: 0, failureLimit: 3, stageIndex: 6, stageProgress: 0 };
  anticipateNextState(state, makeCycleContext());
  assertEqual(state.gameStatus, "won", "anticipateNextState must detect completed ritual and set won");
});

test("anticipateNextState does not draw a card when gameStatus is already won", () => {
  const state = createInitialState();
  state.gameStatus = "won";
  state.deck = [eventPools.events[0]];
  anticipateNextState(state, makeCycleContext());
  assertEqual(state.currentEvent, null, "no card should be drawn when game is already won");
});

test("empty deck rebuilds cycle exactly once without double increment", () => {
  const state = createInitialState();
  state.cycle = 5;
  state.deck = [];
  anticipateNextState(state, makeCycleContext());
  assertEqual(state.cycle, 6, "cycle should increment exactly once, not twice");
});

test("anticipateNextState does not leave currentEvent null when events exist", () => {
  const state = createInitialState();
  state.deck = [];
  anticipateNextState(state, makeCycleContext());
  assert(state.currentEvent !== null, "currentEvent must be set when events are available");
});

// ── defeat effect: starvation and police-raid ─────────────────────────────────

console.log("\ndefeat effect: starvation and police-raid mandatory choices");

test("defeat effect sets gameStatus to lost", () => {
  const state = makeState();
  resolveEffects(state, [{ type: "defeat" }], effectContext);
  assertEqual(state.gameStatus, "lost", "defeat effect must set gameStatus to lost");
});

test("defeat effect does not interfere with sibling resource effects in same call", () => {
  const state = makeState({ resources: { Money: 5, Food: 3, Cultists: 3, Prisoners: 0, Relics: 0, Suspicion: 0 } });
  resolveEffects(state, [
    { type: "resource", resource: "Cultists", amount: -1 },
    { type: "resource", resource: "Suspicion", amount: 2 },
    { type: "defeat" }
  ], effectContext);
  assertEqual(state.resources.Cultists, 2, "Cultists should decrease by 1 before defeat");
  assertEqual(state.resources.Suspicion, 2, "Suspicion should increase before defeat");
  assertEqual(state.gameStatus, "lost", "gameStatus must be lost");
});

test("let-starve choice has a defeat effect in eventPools.json", () => {
  const starvation = eventPools.mandatory.find((e) => e.id === "mandatory-starvation");
  assert(starvation, "mandatory-starvation must exist");
  const choice = starvation.choices.find((c) => c.id === "let-starve");
  assert(choice, "let-starve choice must exist");
  assert(choice.effects.some((e) => e.type === "defeat"),
    "let-starve must carry a defeat effect");
});

test("emergency-cache choice does NOT have a defeat effect (only passive does)", () => {
  const starvation = eventPools.mandatory.find((e) => e.id === "mandatory-starvation");
  const choice = starvation.choices.find((c) => c.id === "emergency-cache");
  assert(choice, "emergency-cache must exist");
  assert(!choice.effects.some((e) => e.type === "defeat"),
    "emergency-cache must not carry a defeat effect");
});

test("thin-the-flock choice does NOT have a defeat effect", () => {
  const starvation = eventPools.mandatory.find((e) => e.id === "mandatory-starvation");
  const choice = starvation.choices.find((c) => c.id === "thin-the-flock");
  assert(choice, "thin-the-flock must exist");
  assert(!choice.effects.some((e) => e.type === "defeat"),
    "thin-the-flock must not carry a defeat effect");
});

test("scatter choice has a defeat effect in eventPools.json", () => {
  const raid = eventPools.mandatory.find((e) => e.id === "mandatory-police-raid");
  assert(raid, "mandatory-police-raid must exist");
  const choice = raid.choices.find((c) => c.id === "scatter");
  assert(choice, "scatter choice must exist");
  assert(choice.effects.some((e) => e.type === "defeat"),
    "scatter must carry a defeat effect");
});

test("bribe choice does NOT have a defeat effect", () => {
  const raid = eventPools.mandatory.find((e) => e.id === "mandatory-police-raid");
  const choice = raid.choices.find((c) => c.id === "bribe");
  assert(choice, "bribe must exist");
  assert(!choice.effects.some((e) => e.type === "defeat"),
    "bribe must not carry a defeat effect");
});

test("frame-prisoner choice does NOT have a defeat effect", () => {
  const raid = eventPools.mandatory.find((e) => e.id === "mandatory-police-raid");
  const choice = raid.choices.find((c) => c.id === "frame-prisoner");
  assert(choice, "frame-prisoner must exist");
  assert(!choice.effects.some((e) => e.type === "defeat"),
    "frame-prisoner must not carry a defeat effect");
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(40)}`);
console.log(`  ${passed} passed   ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) process.exit(1);
