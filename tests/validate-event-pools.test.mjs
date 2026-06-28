// Validation script for data/eventPools.json metadata integrity.
// Run with: node tests/validate-event-pools.test.mjs

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, "../data/eventPools.json"), "utf-8");

let pools;
try {
  pools = JSON.parse(raw);
} catch (e) {
  console.error("FATAL: eventPools.json is not valid JSON:", e.message);
  process.exit(1);
}

// ── Harness ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const issues = [];

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed += 1;
  } else {
    console.error(`  ✗  ${label}${detail ? " — " + detail : ""}`);
    issues.push(label + (detail ? ": " + detail : ""));
    failed += 1;
  }
}

// ── Collect all event IDs for cross-reference ─────────────────────────────────

const allEvents = [...pools.mandatory, ...pools.events];
const allIds = allEvents.map((e) => e.id);
const idSet = new Set(allIds);

// ── 1. No duplicate IDs ───────────────────────────────────────────────────────

console.log("\n1. ID uniqueness");

const seen = new Set();
const duplicates = [];
for (const id of allIds) {
  if (seen.has(id)) duplicates.push(id);
  seen.add(id);
}
check("no duplicate IDs across mandatory[] and events[]",
  duplicates.length === 0,
  duplicates.length > 0 ? "duplicates: " + duplicates.join(", ") : "");

// ── 2. Every mandatory has a trigger ─────────────────────────────────────────

console.log("\n2. Mandatory triggers");

const EXPECTED_MANDATORY_IDS = [
  "mandatory-starvation",
  "mandatory-police-raid",
  "mandatory-greed",
  "mandatory-famine-warn",
  "mandatory-food-riot",
  "mandatory-famine-purge",
  "mandatory-notoriety",
  "mandatory-hacked-accounts",
  "mandatory-deepfakes",
  "mandatory-cosmic-gaze",
  "mandatory-chaos-divide",
  "mandatory-plague-swarm"
];

for (const id of EXPECTED_MANDATORY_IDS) {
  const event = pools.mandatory.find((e) => e.id === id);
  check(`${id} exists`, Boolean(event));
  if (event) {
    check(`${id} has trigger`, Boolean(event.trigger), "trigger field missing");
  }
}

check("all mandatory[] entries have trigger",
  pools.mandatory.every((e) => Boolean(e.trigger)),
  pools.mandatory.filter((e) => !e.trigger).map((e) => e.id).join(", ") || "");

// ── 3. mandatoryPath assignment ───────────────────────────────────────────────

console.log("\n3. mandatoryPath assignment");

const EXPECTED_THEMATIC = {
  starvation: ["mandatory-famine-warn", "mandatory-food-riot", "mandatory-famine-purge"],
  broadcast:  ["mandatory-notoriety", "mandatory-hacked-accounts", "mandatory-deepfakes"],
  outer:      ["mandatory-cosmic-gaze", "mandatory-chaos-divide", "mandatory-plague-swarm"]
};

const EXPECTED_GLOBALS = ["mandatory-starvation", "mandatory-police-raid", "mandatory-greed"];

for (const id of EXPECTED_GLOBALS) {
  const event = pools.mandatory.find((e) => e.id === id);
  if (event) {
    check(`${id} has NO mandatoryPath (global)`, event.mandatoryPath === undefined,
      `unexpected mandatoryPath: ${event.mandatoryPath}`);
  }
}

for (const [path, ids] of Object.entries(EXPECTED_THEMATIC)) {
  for (const id of ids) {
    const event = pools.mandatory.find((e) => e.id === id);
    if (event) {
      check(`${id} has mandatoryPath = "${path}"`, event.mandatoryPath === path,
        `got: ${JSON.stringify(event.mandatoryPath)}`);
    }
  }
}

// ── 4. Trigger structure validity ─────────────────────────────────────────────

console.log("\n4. Trigger structure");

const VALID_OPS = ["<=", ">=", "==", "<", ">"];

function validateTrigger(expr, parentId) {
  if (!expr || typeof expr !== "object") return `${parentId}: trigger is not an object`;
  if (Array.isArray(expr)) return `${parentId}: trigger must not be an array`;
  if (expr.and || expr.or) {
    const children = expr.and || expr.or;
    if (!Array.isArray(children) || children.length === 0)
      return `${parentId}: and/or must be a non-empty array`;
    for (const child of children) {
      const err = validateTrigger(child, parentId);
      if (err) return err;
    }
    return null;
  }
  if (expr.pressure !== undefined) {
    if (expr.pressure !== true) return `${parentId}: pressure must be true`;
    if (!VALID_OPS.includes(expr.op)) return `${parentId}: invalid op "${expr.op}"`;
    if (typeof expr.value !== "number") return `${parentId}: value must be a number`;
    return null;
  }
  if (typeof expr.resource !== "string") return `${parentId}: resource must be a string`;
  if (!VALID_OPS.includes(expr.op)) return `${parentId}: invalid op "${expr.op}"`;
  if (typeof expr.value !== "number") return `${parentId}: value must be a number`;
  return null;
}

for (const event of pools.mandatory) {
  if (!event.trigger) continue;
  const err = validateTrigger(event.trigger, event.id);
  check(`${event.id} trigger is structurally valid`, !err, err || "");
}

// ── 5. upgradeTo references exist ────────────────────────────────────────────

console.log("\n5. upgradeTo cross-references");

const upgradeToProblems = [];
for (const event of allEvents) {
  for (const choice of event.choices || []) {
    if (choice.upgradeTo && !idSet.has(choice.upgradeTo)) {
      upgradeToProblems.push(`${event.id}/${choice.id} → "${choice.upgradeTo}" not found`);
    }
  }
}
check("all upgradeTo values point to existing event IDs",
  upgradeToProblems.length === 0,
  upgradeToProblems.join("; "));

// ── 6. Vision events have setsRitualPath ─────────────────────────────────────

console.log("\n6. setsRitualPath on vision events");

const EXPECTED_VISION = {
  "famine-vision":    "starvation",
  "broadcast-vision": "broadcast",
  "outer-vision":     "outer"
};

for (const [id, expectedPath] of Object.entries(EXPECTED_VISION)) {
  const event = pools.events.find((e) => e.id === id);
  check(`${id} exists in events[]`, Boolean(event));
  if (event) {
    check(`${id} has setsRitualPath = "${expectedPath}"`,
      event.setsRitualPath === expectedPath,
      `got: ${JSON.stringify(event.setsRitualPath)}`);
  }
}

check("no non-vision event has setsRitualPath",
  pools.events
    .filter((e) => !Object.keys(EXPECTED_VISION).includes(e.id))
    .every((e) => e.setsRitualPath === undefined),
  pools.events
    .filter((e) => !Object.keys(EXPECTED_VISION).includes(e.id) && e.setsRitualPath !== undefined)
    .map((e) => e.id).join(", ") || "");

// ── 7. No event in events[] has kind "mandatory" ─────────────────────────────

console.log("\n7. Structural integrity");

check("no events[] entry has kind 'mandatory'",
  pools.events.every((e) => e.kind !== "mandatory"),
  pools.events.filter((e) => e.kind === "mandatory").map((e) => e.id).join(", ") || "");

check("no mandatory[] entry has kind other than 'mandatory'",
  pools.mandatory.every((e) => e.kind === "mandatory"),
  pools.mandatory.filter((e) => e.kind !== "mandatory").map((e) => e.id).join(", ") || "");

console.log(`     mandatory[] count: ${pools.mandatory.length}`);
console.log(`     events[] count:    ${pools.events.length}`);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`  ${passed} passed   ${failed} failed`);
if (issues.length > 0) {
  console.log("\nIssues found:");
  for (const issue of issues) console.error(`  • ${issue}`);
}
console.log(`${"─".repeat(50)}\n`);

if (failed > 0) process.exit(1);
