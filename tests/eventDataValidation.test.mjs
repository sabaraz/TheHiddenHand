// Validates data/eventPools.json against semantic rules without any external deps.
// Run with: node --test tests/eventDataValidation.test.mjs

import { validateEventPools, getKnownRitualPaths } from "../data/validateEventPools.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventPools = JSON.parse(readFileSync(join(__dirname, "../data/eventPools.json"), "utf-8"));
const rituals = JSON.parse(readFileSync(join(__dirname, "../data/rituals.json"), "utf-8"));

// ── Minimal test harness ──────────────────────────────────────────────────────

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

// ── getKnownRitualPaths ───────────────────────────────────────────────────────

console.log("\ngetKnownRitualPaths");

test("derives paths only from events[].ritualPath, not from mandatory[]", () => {
  const pools = {
    events: [
      { id: "e1", ritualPath: "starvation", choices: [] },
      { id: "e2", ritualPath: "broadcast", choices: [] },
      { id: "e3", choices: [] }
    ],
    mandatory: [
      { id: "m1", kind: "mandatory", trigger: {}, ritualPath: "outer", choices: [] }
    ]
  };
  const paths = getKnownRitualPaths(pools);
  assert(paths.has("starvation"), "starvation should be known");
  assert(paths.has("broadcast"), "broadcast should be known");
  assert(!paths.has("outer"), "ritualPath from mandatory[] should not be collected");
  assertEqual(paths.size, 2, `expected 2 known paths, got ${paths.size}`);
});

test("returns empty set when no events have ritualPath", () => {
  const pools = { events: [{ id: "e1", choices: [] }], mandatory: [] };
  const paths = getKnownRitualPaths(pools);
  assertEqual(paths.size, 0, "should be empty when no ritualPath fields exist");
});

test("real eventPools.json yields exactly starvation, broadcast, outer", () => {
  const paths = getKnownRitualPaths(eventPools);
  assert(paths.has("starvation"), "starvation should be a known path");
  assert(paths.has("broadcast"), "broadcast should be a known path");
  assert(paths.has("outer"), "outer should be a known path");
  assertEqual(paths.size, 3, `expected exactly 3 known paths, got ${paths.size}`);
});

// ── Real data passes ──────────────────────────────────────────────────────────

console.log("\nreal data");

test("data/eventPools.json passes validation with no errors", () => {
  const errors = validateEventPools(eventPools, rituals);
  assertEqual(errors.length, 0, `Unexpected errors:\n${errors.join("\n")}`);
});

// ── Error detection ───────────────────────────────────────────────────────────

console.log("\nerror detection");

test("duplicate id within events[] generates error", () => {
  const pools = {
    events: [
      { id: "dup-id", kind: "event", choices: [] },
      { id: "dup-id", kind: "event", choices: [] }
    ],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("dup-id")), "should report the duplicate id");
});

test("duplicate id across events[] and mandatory[] generates error", () => {
  const pools = {
    events: [{ id: "cross-dup", kind: "event", choices: [] }],
    mandatory: [{
      id: "cross-dup", kind: "mandatory",
      trigger: { resource: "Food", op: "<=", value: 0 },
      choices: []
    }]
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("cross-dup")), "should report cross-array duplicate");
});

test("mandatory missing trigger generates error", () => {
  const pools = {
    events: [],
    mandatory: [{ id: "mand-no-trig", kind: "mandatory", choices: [] }]
  };
  const errors = validateEventPools(pools, {});
  assert(
    errors.some(e => e.includes("mand-no-trig") && e.includes("trigger")),
    "should report missing trigger on mandatory"
  );
});

test("mandatory with trigger does not generate a trigger error", () => {
  const pools = {
    events: [],
    mandatory: [{
      id: "mand-ok", kind: "mandatory",
      trigger: { resource: "Food", op: "<=", value: 0 },
      choices: []
    }]
  };
  const errors = validateEventPools(pools, {});
  assert(
    !errors.some(e => e.includes("trigger")),
    "mandatory with trigger should not generate trigger error"
  );
});

test("invalid destination generates error", () => {
  const pools = {
    events: [{
      id: "ev-bad-dest", kind: "event",
      choices: [{ id: "c1", destination: "vanish", effects: [] }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("vanish")), "should report invalid destination");
});

test("all seven valid destinations pass without error", () => {
  const validDests = ["discard", "remove", "defer", "return", "upgrade", "brutalize", "stabilize"];
  for (const dest of validDests) {
    const pools = {
      events: [{ id: "ev", kind: "event", choices: [{ id: "c1", destination: dest, effects: [] }] }],
      mandatory: []
    };
    const errors = validateEventPools(pools, {});
    assert(
      !errors.some(e => e.includes("destination")),
      `"${dest}" should be a valid destination`
    );
  }
});

test("invalid effect type generates error", () => {
  const pools = {
    events: [{
      id: "ev-bad-fx", kind: "event",
      choices: [{ id: "c1", effects: [{ type: "teleport" }] }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("teleport")), "should report invalid effect type");
});

test("all known valid effect types pass without error", () => {
  const validTypes = [
    "resource", "pressure", "flag", "opportunityUsed", "deferEvent",
    "startSelectedRitual", "advanceRitual", "advanceRitualChance",
    "ritualFailure", "ritualStabilize", "stabilizeCycle"
  ];
  for (const type of validTypes) {
    const pools = {
      events: [{
        id: "ev", kind: "event",
        choices: [{ id: "c1", effects: [{ type }] }]
      }],
      mandatory: []
    };
    const errors = validateEventPools(pools, {});
    assert(
      !errors.some(e => e.includes(`"${type}"`)),
      `"${type}" should be a valid effect type`
    );
  }
});

test("upgradeTo pointing to nonexistent event generates error", () => {
  const pools = {
    events: [{
      id: "ev-base", kind: "event",
      choices: [{ id: "c1", destination: "upgrade", upgradeTo: "ghost-event", effects: [] }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("ghost-event")), "should report missing upgradeTo target");
});

test("upgradeTo pointing to existing event in events[] passes", () => {
  const pools = {
    events: [
      { id: "ev-base", kind: "event", choices: [{ id: "c1", destination: "upgrade", upgradeTo: "ev-upgraded", effects: [] }] },
      { id: "ev-upgraded", kind: "event", choices: [] }
    ],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(!errors.some(e => e.includes("upgradeTo")), "valid upgradeTo should not generate error");
});

test("upgradeTo pointing to an id in mandatory[] passes", () => {
  const pools = {
    events: [{
      id: "ev-base", kind: "event",
      choices: [{ id: "c1", destination: "upgrade", upgradeTo: "mand-target", effects: [] }]
    }],
    mandatory: [{
      id: "mand-target", kind: "mandatory",
      trigger: { resource: "Food", op: "<=", value: 0 },
      choices: []
    }]
  };
  const errors = validateEventPools(pools, {});
  assert(!errors.some(e => e.includes("upgradeTo")), "upgradeTo pointing to mandatory id should pass");
});

test("startRitual with unknown ritualId generates error", () => {
  const pools = {
    events: [{
      id: "ev-ritual", kind: "event",
      choices: [{ id: "c1", effects: [{ type: "startRitual", ritualId: "phantomRitual" }] }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, { realRitual: {} });
  assert(errors.some(e => e.includes("phantomRitual")), "should report unknown ritualId");
});

test("startRitual with known ritualId passes", () => {
  const pools = {
    events: [{
      id: "ev-ritual", kind: "event",
      choices: [{ id: "c1", effects: [{ type: "startRitual", ritualId: "finalSummoning" }] }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, { finalSummoning: {} });
  assert(
    !errors.some(e => e.includes("phantomRitual")),
    "known ritualId should not generate error"
  );
});

test("unknown mandatoryPath generates error", () => {
  const pools = {
    events: [{ id: "v1", ritualPath: "starvation", choices: [] }],
    mandatory: [{
      id: "m1", kind: "mandatory",
      trigger: { resource: "Food", op: "<=", value: 0 },
      mandatoryPath: "nonexistent-path",
      choices: []
    }]
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("nonexistent-path")), "should report unknown mandatoryPath");
});

test("known mandatoryPath passes", () => {
  const pools = {
    events: [{ id: "v1", ritualPath: "starvation", choices: [] }],
    mandatory: [{
      id: "m1", kind: "mandatory",
      trigger: { resource: "Food", op: "<=", value: 0 },
      mandatoryPath: "starvation",
      choices: []
    }]
  };
  const errors = validateEventPools(pools, {});
  assert(!errors.some(e => e.includes("mandatoryPath")), "valid mandatoryPath should not generate error");
});

test("unknown setsRitualPath generates error", () => {
  const pools = {
    events: [
      { id: "v1", ritualPath: "starvation", setsRitualPath: "undefined-path", choices: [] }
    ],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("undefined-path")), "should report unknown setsRitualPath");
});

test("setsRitualPath matching a known path passes", () => {
  const pools = {
    events: [
      { id: "v1", ritualPath: "starvation", setsRitualPath: "starvation", choices: [] }
    ],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(!errors.some(e => e.includes("setsRitualPath")), "valid setsRitualPath should not generate error");
});

test("unknown startsRitualId generates error", () => {
  const pools = {
    events: [{ id: "v1", startsRitualId: "phantomRite", choices: [] }],
    mandatory: []
  };
  const errors = validateEventPools(pools, { finalSummoning: {} });
  assert(errors.some(e => e.includes("phantomRite")), "should report unknown startsRitualId");
});

test("known startsRitualId passes", () => {
  const pools = {
    events: [{ id: "v1", startsRitualId: "hungerRite", choices: [] }],
    mandatory: []
  };
  const errors = validateEventPools(pools, { hungerRite: {} });
  assert(!errors.some(e => e.includes("startsRitualId")), "valid startsRitualId should not generate error");
});

test("real eventPools.json vision events have correct startsRitualId", () => {
  const fatten = eventPools.events.find(e => e.id === "famine-vision");
  assertEqual(fatten?.startsRitualId, "hungerRite", "famine-vision must declare startsRitualId hungerRite");
  const broadcast = eventPools.events.find(e => e.id === "broadcast-vision");
  assertEqual(broadcast?.startsRitualId, "signalPact", "broadcast-vision must declare startsRitualId signalPact");
  const outer = eventPools.events.find(e => e.id === "outer-vision");
  assertEqual(outer?.startsRitualId, "eyeRite", "outer-vision must declare startsRitualId eyeRite");
});

// ── mirrorsCost validation ────────────────────────────────────────────────────

console.log("\nmirrorsCost validation");

test("mirrorsCost: true with matching cost passes", () => {
  const pools = {
    events: [{
      id: "ev1", kind: "event",
      choices: [{
        id: "c1",
        cost: { Suspicion: 3 },
        effects: [{ type: "resource", resource: "Suspicion", amount: -3, mirrorsCost: true }]
      }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(!errors.some(e => e.includes("mirrorsCost")), "valid mirrorsCost should not generate error");
});

test("mirrorsCost: true on non-resource effect generates error", () => {
  const pools = {
    events: [{
      id: "ev1", kind: "event",
      choices: [{
        id: "c1",
        cost: { Suspicion: 3 },
        effects: [{ type: "pressure", amount: -1, mirrorsCost: true }]
      }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("mirrorsCost") && e.includes("resource")),
    "mirrorsCost on non-resource effect should generate error");
});

test("mirrorsCost: true with positive amount generates error", () => {
  const pools = {
    events: [{
      id: "ev1", kind: "event",
      choices: [{
        id: "c1",
        cost: { Suspicion: 3 },
        effects: [{ type: "resource", resource: "Suspicion", amount: 3, mirrorsCost: true }]
      }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("mirrorsCost") && e.includes("amount < 0")),
    "mirrorsCost: true with amount >= 0 should generate error");
});

test("mirrorsCost: true without matching cost for the resource generates error", () => {
  const pools = {
    events: [{
      id: "ev1", kind: "event",
      choices: [{
        id: "c1",
        cost: { Money: 3 },  // no Suspicion cost
        effects: [{ type: "resource", resource: "Suspicion", amount: -3, mirrorsCost: true }]
      }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("mirrorsCost") && e.includes("Suspicion")),
    "mirrorsCost: true without matching cost should generate error");
});

test("mirrorsCost: true without any cost object at all generates error", () => {
  const pools = {
    events: [{
      id: "ev1", kind: "event",
      choices: [{
        id: "c1",
        // no cost field
        effects: [{ type: "resource", resource: "Suspicion", amount: -3, mirrorsCost: true }]
      }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(errors.some(e => e.includes("mirrorsCost") && e.includes("Suspicion")),
    "mirrorsCost: true with no cost object should generate error");
});

test("normal Suspicion reduction without mirrorsCost does not generate any error", () => {
  const pools = {
    events: [{
      id: "ev1", kind: "event",
      choices: [{
        id: "c1",
        effects: [{ type: "resource", resource: "Suspicion", amount: -2 }]
      }]
    }],
    mandatory: []
  };
  const errors = validateEventPools(pools, {});
  assert(!errors.some(e => e.includes("Suspicion")), "normal Suspicion effect without mirrorsCost must not generate error");
});

test("real data: eventPools.json still passes validation with no errors after mirrorsCost rules added", () => {
  const errors = validateEventPools(eventPools, rituals);
  assertEqual(errors.length, 0, `Unexpected errors:\n${errors.join("\n")}`);
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`  ${passed} passed   ${failed} failed`);
console.log("─".repeat(50));

if (failed > 0) process.exit(1);
