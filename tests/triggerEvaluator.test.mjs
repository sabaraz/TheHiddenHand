// Unit tests for rules/triggerEvaluator.js
// Run with: node tests/triggerEvaluator.test.mjs

import { evalTrigger } from "../rules/triggerEvaluator.js";

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

// Minimal state fixture
function makeState(resources = {}, pressure = 0) {
  return {
    resources: { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 0, Suspicion: 0, ...resources },
    pressure
  };
}

// ── resource comparisons ───────────────────────────────────────────────────────

console.log("\nresource <=");

test("Food <= 0 fires when Food is 0", () => {
  assert(evalTrigger({ resource: "Food", op: "<=", value: 0 }, makeState({ Food: 0 })));
});

test("Food <= 0 fires when Food is negative (clamped state would prevent this, but evaluator is neutral)", () => {
  assert(evalTrigger({ resource: "Food", op: "<=", value: 0 }, makeState({ Food: -1 })));
});

test("Food <= 0 does NOT fire when Food is 1", () => {
  assert(!evalTrigger({ resource: "Food", op: "<=", value: 0 }, makeState({ Food: 1 })));
});

test("Food <= 1 fires when Food is 1", () => {
  assert(evalTrigger({ resource: "Food", op: "<=", value: 1 }, makeState({ Food: 1 })));
});

test("Food <= 1 does NOT fire when Food is 2", () => {
  assert(!evalTrigger({ resource: "Food", op: "<=", value: 1 }, makeState({ Food: 2 })));
});

console.log("\nresource >=");

test("Suspicion >= 5 fires when Suspicion is 5", () => {
  assert(evalTrigger({ resource: "Suspicion", op: ">=", value: 5 }, makeState({ Suspicion: 5 })));
});

test("Suspicion >= 5 fires when Suspicion is 7", () => {
  assert(evalTrigger({ resource: "Suspicion", op: ">=", value: 5 }, makeState({ Suspicion: 7 })));
});

test("Suspicion >= 5 does NOT fire when Suspicion is 4", () => {
  assert(!evalTrigger({ resource: "Suspicion", op: ">=", value: 5 }, makeState({ Suspicion: 4 })));
});

console.log("\nresource ==");

test("Cultists == 3 fires when Cultists is 3", () => {
  assert(evalTrigger({ resource: "Cultists", op: "==", value: 3 }, makeState({ Cultists: 3 })));
});

test("Cultists == 3 does NOT fire when Cultists is 2", () => {
  assert(!evalTrigger({ resource: "Cultists", op: "==", value: 3 }, makeState({ Cultists: 2 })));
});

console.log("\nresource < and >");

test("Money < 2 fires when Money is 1", () => {
  assert(evalTrigger({ resource: "Money", op: "<", value: 2 }, makeState({ Money: 1 })));
});

test("Money < 2 does NOT fire when Money is 2", () => {
  assert(!evalTrigger({ resource: "Money", op: "<", value: 2 }, makeState({ Money: 2 })));
});

test("Relics > 0 fires when Relics is 1", () => {
  assert(evalTrigger({ resource: "Relics", op: ">", value: 0 }, makeState({ Relics: 1 })));
});

test("Relics > 0 does NOT fire when Relics is 0", () => {
  assert(!evalTrigger({ resource: "Relics", op: ">", value: 0 }, makeState({ Relics: 0 })));
});

// ── _sum ──────────────────────────────────────────────────────────────────────

console.log("\n_sum");

test("_sum >= 15 fires when sum of all resources is exactly 15", () => {
  // 5+3+2+0+0+5 = 15
  const state = makeState({ Money: 5, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 5 });
  assert(evalTrigger({ resource: "_sum", op: ">=", value: 15 }, state));
});

test("_sum includes Suspicion in the total", () => {
  // Without Suspicion: 4+2+2+0+0 = 8. With Suspicion 7: 8+7 = 15.
  const state = makeState({ Money: 4, Food: 2, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 7 });
  assert(evalTrigger({ resource: "_sum", op: ">=", value: 15 }, state));
});

test("_sum does NOT fire when sum is 14", () => {
  // 3+3+2+0+0+6 = 14
  const state = makeState({ Money: 3, Food: 3, Cultists: 2, Prisoners: 0, Relics: 0, Suspicion: 6 });
  assert(!evalTrigger({ resource: "_sum", op: ">=", value: 15 }, state));
});

test("_sum counts all six resource types", () => {
  const state = makeState({ Money: 1, Food: 1, Cultists: 1, Prisoners: 1, Relics: 1, Suspicion: 1 });
  assert(evalTrigger({ resource: "_sum", op: "==", value: 6 }, state));
});

// ── pressure ──────────────────────────────────────────────────────────────────

console.log("\npressure");

test("pressure >= 2 fires when pressure is 2", () => {
  assert(evalTrigger({ pressure: true, op: ">=", value: 2 }, makeState({}, 2)));
});

test("pressure >= 2 fires when pressure is 5", () => {
  assert(evalTrigger({ pressure: true, op: ">=", value: 2 }, makeState({}, 5)));
});

test("pressure >= 2 does NOT fire when pressure is 1", () => {
  assert(!evalTrigger({ pressure: true, op: ">=", value: 2 }, makeState({}, 1)));
});

test("pressure == 0 fires when pressure is 0", () => {
  assert(evalTrigger({ pressure: true, op: "==", value: 0 }, makeState({}, 0)));
});

// ── and ───────────────────────────────────────────────────────────────────────

console.log("\nand");

test("and: both true → true", () => {
  const state = makeState({ Food: 0, Cultists: 3 });
  assert(evalTrigger({
    and: [
      { resource: "Food", op: "<=", value: 0 },
      { resource: "Cultists", op: ">=", value: 3 }
    ]
  }, state));
});

test("and: first false → false", () => {
  const state = makeState({ Food: 1, Cultists: 3 });
  assert(!evalTrigger({
    and: [
      { resource: "Food", op: "<=", value: 0 },
      { resource: "Cultists", op: ">=", value: 3 }
    ]
  }, state));
});

test("and: second false → false", () => {
  const state = makeState({ Food: 0, Cultists: 2 });
  assert(!evalTrigger({
    and: [
      { resource: "Food", op: "<=", value: 0 },
      { resource: "Cultists", op: ">=", value: 3 }
    ]
  }, state));
});

test("and: both false → false", () => {
  const state = makeState({ Food: 2, Cultists: 1 });
  assert(!evalTrigger({
    and: [
      { resource: "Food", op: "<=", value: 0 },
      { resource: "Cultists", op: ">=", value: 3 }
    ]
  }, state));
});

test("and: mixed pressure + resource", () => {
  const state = makeState({ Cultists: 5 }, 3);
  assert(evalTrigger({
    and: [
      { resource: "Cultists", op: ">=", value: 4 },
      { pressure: true, op: ">=", value: 2 }
    ]
  }, state));
});

// ── or ────────────────────────────────────────────────────────────────────────

console.log("\nor");

test("or: both true → true", () => {
  const state = makeState({ Food: 0, Suspicion: 5 });
  assert(evalTrigger({
    or: [
      { resource: "Food", op: "<=", value: 0 },
      { resource: "Suspicion", op: ">=", value: 5 }
    ]
  }, state));
});

test("or: first true, second false → true", () => {
  const state = makeState({ Food: 0, Suspicion: 1 });
  assert(evalTrigger({
    or: [
      { resource: "Food", op: "<=", value: 0 },
      { resource: "Suspicion", op: ">=", value: 5 }
    ]
  }, state));
});

test("or: first false, second true → true", () => {
  const state = makeState({ Food: 2, Suspicion: 6 });
  assert(evalTrigger({
    or: [
      { resource: "Food", op: "<=", value: 0 },
      { resource: "Suspicion", op: ">=", value: 5 }
    ]
  }, state));
});

test("or: both false → false", () => {
  const state = makeState({ Food: 2, Suspicion: 2 });
  assert(!evalTrigger({
    or: [
      { resource: "Food", op: "<=", value: 0 },
      { resource: "Suspicion", op: ">=", value: 5 }
    ]
  }, state));
});

// ── edge cases ────────────────────────────────────────────────────────────────

console.log("\nedge cases");

test("null trigger returns false", () => {
  assert(!evalTrigger(null, makeState()));
});

test("undefined trigger returns false", () => {
  assert(!evalTrigger(undefined, makeState()));
});

test("array trigger returns false", () => {
  assert(!evalTrigger([], makeState()));
});

test("unknown op returns false", () => {
  assert(!evalTrigger({ resource: "Food", op: "!=", value: 0 }, makeState({ Food: 1 })));
});

test("unknown op '%%' returns false", () => {
  assert(!evalTrigger({ resource: "Food", op: "%%", value: 0 }, makeState({ Food: 0 })));
});

test("unknown resource uses 0 as fallback", () => {
  // resource "Mana" does not exist → treated as 0 → 0 <= 0 is true
  assert(evalTrigger({ resource: "Mana", op: "<=", value: 0 }, makeState()));
});

test("unknown resource >= 1 returns false (fallback 0 < 1)", () => {
  assert(!evalTrigger({ resource: "Mana", op: ">=", value: 1 }, makeState()));
});

test("trigger with no recognized key returns false", () => {
  assert(!evalTrigger({ foo: "bar" }, makeState()));
});

test("and with empty array returns false (invalid trigger)", () => {
  assert(!evalTrigger({ and: [] }, makeState()));
});

test("or with empty array returns false (vacuous falsity)", () => {
  // some() on empty array is false
  assert(!evalTrigger({ or: [] }, makeState()));
});

test("non-number value returns false", () => {
  assert(!evalTrigger({ resource: "Food", op: "<=", value: "0" }, makeState({ Food: 0 })));
});

test("nested and inside or", () => {
  const state = makeState({ Food: 0, Money: 0, Suspicion: 6 });
  assert(evalTrigger({
    or: [
      { and: [{ resource: "Food", op: "<=", value: 0 }, { resource: "Money", op: "<=", value: 0 }] },
      { resource: "Suspicion", op: ">=", value: 10 }
    ]
  }, state));
});

test("nested or inside and", () => {
  const state = makeState({ Food: 0, Suspicion: 6, Cultists: 1 });
  assert(evalTrigger({
    and: [
      { or: [{ resource: "Food", op: "<=", value: 0 }, { resource: "Cultists", op: ">=", value: 5 }] },
      { resource: "Suspicion", op: ">=", value: 5 }
    ]
  }, state));
});

test("_sum with all-zero resources returns 0", () => {
  assert(evalTrigger({ resource: "_sum", op: "==", value: 0 }, makeState()));
});

// ── cross-check against mandatoryRules.js hardcoded triggers ─────────────────

console.log("\ncross-check vs mandatoryRules.js");

test("mandatory-starvation: Food<=0 matches JS shouldFire", () => {
  const trigger = { resource: "Food", op: "<=", value: 0 };
  const onState  = makeState({ Food: 0 });
  const offState = makeState({ Food: 1 });
  assertEqual(evalTrigger(trigger, onState),  true,  "should fire at Food=0");
  assertEqual(evalTrigger(trigger, offState), false, "should not fire at Food=1");
});

test("mandatory-police-raid: Suspicion>=5 matches JS shouldFire", () => {
  const trigger = { resource: "Suspicion", op: ">=", value: 5 };
  assert(evalTrigger(trigger, makeState({ Suspicion: 5 })));
  assert(!evalTrigger(trigger, makeState({ Suspicion: 4 })));
});

test("mandatory-greed: _sum>=15 matches JS shouldFire", () => {
  const trigger = { resource: "_sum", op: ">=", value: 15 };
  // 5+3+2+0+0+5 = 15
  assert(evalTrigger(trigger, makeState({ Money: 5, Food: 3, Cultists: 2, Suspicion: 5 })));
  // 4+3+2+0+0+5 = 14
  assert(!evalTrigger(trigger, makeState({ Money: 4, Food: 3, Cultists: 2, Suspicion: 5 })));
});

test("mandatory-famine-warn: Food<=1 matches JS shouldFire", () => {
  const trigger = { resource: "Food", op: "<=", value: 1 };
  assert(evalTrigger(trigger, makeState({ Food: 1 })));
  assert(!evalTrigger(trigger, makeState({ Food: 2 })));
});

test("mandatory-food-riot: Food<=0 AND Cultists>=3 matches JS shouldFire", () => {
  const trigger = { and: [{ resource: "Food", op: "<=", value: 0 }, { resource: "Cultists", op: ">=", value: 3 }] };
  assert(evalTrigger(trigger, makeState({ Food: 0, Cultists: 3 })));
  assert(!evalTrigger(trigger, makeState({ Food: 0, Cultists: 2 })));
  assert(!evalTrigger(trigger, makeState({ Food: 1, Cultists: 3 })));
});

test("mandatory-famine-purge: Food<=0 AND Money<=0 matches JS shouldFire", () => {
  const trigger = { and: [{ resource: "Food", op: "<=", value: 0 }, { resource: "Money", op: "<=", value: 0 }] };
  assert(evalTrigger(trigger, makeState({ Food: 0, Money: 0 })));
  assert(!evalTrigger(trigger, makeState({ Food: 0, Money: 1 })));
});

test("mandatory-notoriety: Suspicion>=4 matches JS shouldFire", () => {
  const trigger = { resource: "Suspicion", op: ">=", value: 4 };
  assert(evalTrigger(trigger, makeState({ Suspicion: 4 })));
  assert(!evalTrigger(trigger, makeState({ Suspicion: 3 })));
});

test("mandatory-hacked-accounts: Money<=0 matches JS shouldFire", () => {
  const trigger = { resource: "Money", op: "<=", value: 0 };
  assert(evalTrigger(trigger, makeState({ Money: 0 })));
  assert(!evalTrigger(trigger, makeState({ Money: 1 })));
});

test("mandatory-deepfakes: Suspicion>=3 matches JS shouldFire", () => {
  const trigger = { resource: "Suspicion", op: ">=", value: 3 };
  assert(evalTrigger(trigger, makeState({ Suspicion: 3 })));
  assert(!evalTrigger(trigger, makeState({ Suspicion: 2 })));
});

test("mandatory-cosmic-gaze: Relics>=2 matches JS shouldFire", () => {
  const trigger = { resource: "Relics", op: ">=", value: 2 };
  assert(evalTrigger(trigger, makeState({ Relics: 2 })));
  assert(!evalTrigger(trigger, makeState({ Relics: 1 })));
});

test("mandatory-chaos-divide: Cultists>=4 AND pressure>=2 matches JS shouldFire", () => {
  const trigger = { and: [{ resource: "Cultists", op: ">=", value: 4 }, { pressure: true, op: ">=", value: 2 }] };
  assert(evalTrigger(trigger, makeState({ Cultists: 4 }, 2)));
  assert(!evalTrigger(trigger, makeState({ Cultists: 4 }, 1)));
  assert(!evalTrigger(trigger, makeState({ Cultists: 3 }, 2)));
});

test("mandatory-plague-swarm: Food<=1 AND Relics>=1 matches JS shouldFire", () => {
  const trigger = { and: [{ resource: "Food", op: "<=", value: 1 }, { resource: "Relics", op: ">=", value: 1 }] };
  assert(evalTrigger(trigger, makeState({ Food: 1, Relics: 1 })));
  assert(!evalTrigger(trigger, makeState({ Food: 2, Relics: 1 })));
  assert(!evalTrigger(trigger, makeState({ Food: 1, Relics: 0 })));
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(40)}`);
console.log(`  ${passed} passed   ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) process.exit(1);
