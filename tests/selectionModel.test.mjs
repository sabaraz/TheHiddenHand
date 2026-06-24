// Pure-logic tests for selectionModel.js — no DOM, no game state mutation.
// Run with: node tests/selectionModel.test.mjs

import {
  buildRequirement,
  emptyPicks,
  isSelectionComplete,
  canEverAfford,
  selectionStatus,
  payableResources
} from "../rules/selectionModel.js";

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

// ── buildRequirement ──────────────────────────────────────────────────────────

console.log("\nbuildRequirement");

test("empty cost → empty requirement", () => {
  const req = buildRequirement({});
  assertEqual(req.length, 0);
});

test("humanPower maps to Cultists + Prisoners", () => {
  const req = buildRequirement({ humanPower: 2 });
  assertEqual(req.length, 1);
  assertEqual(req[0].need, 2);
  assert(req[0].payableWith.includes("Cultists"));
  assert(req[0].payableWith.includes("Prisoners"));
  assert(!req[0].payableWith.includes("Relics"));
});

test("Suspicion maps to payableWith Suspicion only", () => {
  const req = buildRequirement({ Suspicion: 1 });
  assertEqual(req.length, 1);
  assertEqual(JSON.stringify(req[0].payableWith), JSON.stringify(["Suspicion"]));
});

test("Money without relic substitution → payableWith Money only", () => {
  const req = buildRequirement({ Money: 2 }, false);
  assertEqual(req[0].payableWith.length, 1);
  assert(req[0].payableWith.includes("Money"));
});

test("Money with allowRelicSubstitution → payableWith Money + Relics", () => {
  const req = buildRequirement({ Money: 2 }, true);
  assert(req[0].payableWith.includes("Money"));
  assert(req[0].payableWith.includes("Relics"));
});

test("zero-amount entries are ignored", () => {
  const req = buildRequirement({ Money: 0, Food: 2 });
  assertEqual(req.length, 1);
  assertEqual(req[0].payableWith[0], "Food");
});

// ── isSelectionComplete ───────────────────────────────────────────────────────

console.log("\nisSelectionComplete");

const RES = { Money: 3, Food: 2, Cultists: 2, Prisoners: 1, Relics: 2, Suspicion: 0 };

test("zero-cost → complete with emptyPicks", () => {
  assert(isSelectionComplete([], emptyPicks(), RES));
});

test("zero-cost → incomplete if any pick > 0", () => {
  const picks = { ...emptyPicks(), Money: 1 };
  assert(!isSelectionComplete([], picks, RES));
});

test("insufficient picks → incomplete", () => {
  const req = buildRequirement({ Money: 2 });
  const picks = { ...emptyPicks(), Money: 1 };
  assert(!isSelectionComplete(req, picks, RES));
});

test("exact picks → complete", () => {
  const req = buildRequirement({ Money: 2 });
  const picks = { ...emptyPicks(), Money: 2 };
  assert(isSelectionComplete(req, picks, RES));
});

test("over-picks → incomplete (excess)", () => {
  const req = buildRequirement({ Money: 2 });
  const picks = { ...emptyPicks(), Money: 3 };
  assert(!isSelectionComplete(req, picks, RES));
});

test("picks exceed available resources → invalid", () => {
  const req = buildRequirement({ Money: 2 });
  const picks = { ...emptyPicks(), Money: 5 }; // only 3 available
  assert(!isSelectionComplete(req, picks, RES));
});

test("humanPower paid by Cultist only", () => {
  const req = buildRequirement({ humanPower: 2 });
  const picks = { ...emptyPicks(), Cultists: 2 };
  assert(isSelectionComplete(req, picks, RES));
});

test("humanPower paid by Prisoner only", () => {
  const req = buildRequirement({ humanPower: 1 });
  const picks = { ...emptyPicks(), Prisoners: 1 };
  assert(isSelectionComplete(req, picks, RES));
});

test("humanPower paid by mixed Cultist + Prisoner", () => {
  const req = buildRequirement({ humanPower: 2 });
  const picks = { ...emptyPicks(), Cultists: 1, Prisoners: 1 };
  assert(isSelectionComplete(req, picks, RES));
});

test("humanPower wrong resource (Money) → incomplete", () => {
  const req = buildRequirement({ humanPower: 1 });
  const picks = { ...emptyPicks(), Money: 1 };
  assert(!isSelectionComplete(req, picks, RES));
});

test("Relic substituting Money", () => {
  const req = buildRequirement({ Money: 2 }, true);
  const resources = { ...RES, Money: 0, Relics: 3 };
  const picks = { ...emptyPicks(), Relics: 2 };
  assert(isSelectionComplete(req, picks, resources));
});

test("Relic substituting Money — mixed Money + Relic", () => {
  const req = buildRequirement({ Money: 2 }, true);
  const picks = { ...emptyPicks(), Money: 1, Relics: 1 };
  assert(isSelectionComplete(req, picks, RES));
});

test("Suspicion as cost", () => {
  const req = buildRequirement({ Suspicion: 2 });
  const resources = { ...RES, Suspicion: 3 };
  const picks = { ...emptyPicks(), Suspicion: 2 };
  assert(isSelectionComplete(req, picks, resources));
});

test("multi-item requirement — both items satisfied", () => {
  const req = buildRequirement({ Money: 1, humanPower: 1 });
  const picks = { ...emptyPicks(), Money: 1, Cultists: 1 };
  assert(isSelectionComplete(req, picks, RES));
});

// ── canEverAfford ─────────────────────────────────────────────────────────────

console.log("\ncanEverAfford");

test("zero-cost → always affordable", () => {
  assert(canEverAfford([], {}));
});

test("has enough money", () => {
  const req = buildRequirement({ Money: 2 });
  assert(canEverAfford(req, { Money: 2 }));
});

test("not enough money → impossible", () => {
  const req = buildRequirement({ Money: 3 });
  assert(!canEverAfford(req, { Money: 2 }));
});

test("possible via Relic substitution", () => {
  const req = buildRequirement({ Money: 2 }, true);
  assert(canEverAfford(req, { Money: 0, Relics: 3 }));
});

test("impossible even with relics when no substitution flag", () => {
  const req = buildRequirement({ Money: 2 }, false);
  assert(!canEverAfford(req, { Money: 0, Relics: 5 }));
});

test("humanPower via Cultists", () => {
  const req = buildRequirement({ humanPower: 2 });
  assert(canEverAfford(req, { Cultists: 2, Prisoners: 0 }));
});

test("humanPower via Prisoners", () => {
  const req = buildRequirement({ humanPower: 1 });
  assert(canEverAfford(req, { Cultists: 0, Prisoners: 1 }));
});

test("humanPower impossible — total human power insufficient", () => {
  const req = buildRequirement({ humanPower: 3 });
  assert(!canEverAfford(req, { Cultists: 1, Prisoners: 1 }));
});

// ── selectionStatus ───────────────────────────────────────────────────────────

console.log("\nselectionStatus");

test("no picks, need 2 → shortage 2", () => {
  const req = buildRequirement({ Money: 2 });
  const { shortage, excess } = selectionStatus(req, emptyPicks(), RES);
  assertEqual(shortage, 2);
  assertEqual(excess, 0);
});

test("exact picks → shortage 0, excess 0", () => {
  const req = buildRequirement({ Money: 2 });
  const picks = { ...emptyPicks(), Money: 2 };
  const { shortage, excess } = selectionStatus(req, picks, RES);
  assertEqual(shortage, 0);
  assertEqual(excess, 0);
});

test("over-picks → excess > 0", () => {
  const req = buildRequirement({ Money: 1 });
  const picks = { ...emptyPicks(), Money: 3 };
  const { shortage, excess } = selectionStatus(req, picks, RES);
  assertEqual(shortage, 0);
  assert(excess > 0);
});

// ── Commit debit invariant ────────────────────────────────────────────────────

console.log("\ncommit debit invariant");

test("isSelectionComplete true → exactly picks satisfy requirement (no hidden cost)", () => {
  const req = buildRequirement({ Money: 1, humanPower: 1 });
  const picks = { ...emptyPicks(), Money: 1, Cultists: 1 };
  const complete = isSelectionComplete(req, picks, RES);
  assert(complete, "should be complete");

  // Simulate debit: only picks are subtracted
  const after = { ...RES };
  for (const [r, count] of Object.entries(picks)) {
    if (count > 0) after[r] = after[r] - count;
  }
  assertEqual(after.Money, RES.Money - 1);
  assertEqual(after.Cultists, RES.Cultists - 1);
  // Everything else untouched
  assertEqual(after.Prisoners, RES.Prisoners);
  assertEqual(after.Food, RES.Food);
  assertEqual(after.Relics, RES.Relics);
});

// ── payableResources ──────────────────────────────────────────────────────────

console.log("\npayableResources");

test("humanPower + Money → Cultists, Prisoners, Money in set", () => {
  const req = buildRequirement({ humanPower: 1, Money: 1 });
  const set = payableResources(req);
  assert(set.has("Cultists"));
  assert(set.has("Prisoners"));
  assert(set.has("Money"));
  assert(!set.has("Food"));
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(40)}`);
console.log(`  ${passed} passed   ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) process.exit(1);
