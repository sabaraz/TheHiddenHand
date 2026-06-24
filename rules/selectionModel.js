// Pure logic: no DOM, no game state mutation.
// The single source of truth for "what the player owes" and "what they've picked".

const COMMON_RESOURCES = ["Money", "Food", "Cultists", "Prisoners"];

/**
 * Translate a raw cost object + substitution flag into a normalized requirement array.
 * Each item knows exactly which resource types can satisfy it.
 */
export function buildRequirement(cost = {}, allowRelicSubstitution = false) {
  const req = [];
  for (const [resource, amount] of Object.entries(cost)) {
    if (amount <= 0) continue;
    if (resource === "humanPower") {
      req.push({ need: amount, payableWith: ["Cultists", "Prisoners"] });
    } else if (resource === "Suspicion") {
      req.push({ need: amount, payableWith: ["Suspicion"] });
    } else {
      const payableWith = [resource];
      if (allowRelicSubstitution && COMMON_RESOURCES.includes(resource)) {
        payableWith.push("Relics");
      }
      req.push({ need: amount, payableWith });
    }
  }
  return req;
}

/** Zero-valued picks record, one key per resource. */
export function emptyPicks() {
  return { Money: 0, Food: 0, Cultists: 0, Prisoners: 0, Relics: 0, Suspicion: 0 };
}

/**
 * Convert a Set of instance IDs ("Money:0", "Food:2", …) into aggregate
 * per-resource counts for validation and engine commit.
 */
export function picksFromIds(pickedIds) {
  const picks = emptyPicks();
  for (const id of pickedIds) {
    const resource = id.split(":")[0];
    if (resource in picks) picks[resource] += 1;
  }
  return picks;
}

/** Set of resource names that appear in ANY payableWith list of this requirement. */
export function payableResources(requirement) {
  const set = new Set();
  for (const item of requirement) {
    for (const r of item.payableWith) set.add(r);
  }
  return set;
}

/**
 * Internal: greedy assignment from picks → requirement items.
 * Most-constrained items (fewest payableWith options) are served first to
 * minimise the chance that a flexible resource blocks a specific-only slot.
 * Returns { rem: remaining unspent picks, satisfied: bool }.
 */
function runAssignment(requirement, picks) {
  const sorted = [...requirement].sort((a, b) => a.payableWith.length - b.payableWith.length);
  const rem = { ...picks };
  let satisfied = true;
  for (const item of sorted) {
    let needed = item.need;
    for (const r of item.payableWith) {
      const use = Math.min(rem[r] || 0, needed);
      rem[r] = (rem[r] || 0) - use;
      needed -= use;
      if (needed === 0) break;
    }
    if (needed > 0) {
      satisfied = false;
      break;
    }
  }
  return { rem, satisfied };
}

/**
 * Pure predicate: are the player's picks a valid, complete payment?
 * Rules:
 *  1. picks[r] must not exceed resources[r]  (can't pay with what you lack)
 *  2. Every requirement item must be satisfiable from the picks
 *  3. No picks may be left over (player chose exactly the right amount)
 */
export function isSelectionComplete(requirement, picks, resources) {
  for (const [r, count] of Object.entries(picks)) {
    if (count < 0 || count > (resources[r] || 0)) return false;
  }
  if (requirement.length === 0) {
    return Object.values(picks).reduce((a, b) => a + b, 0) === 0;
  }
  const { rem, satisfied } = runAssignment(requirement, picks);
  if (!satisfied) return false;
  return Object.values(rem).reduce((a, b) => a + b, 0) === 0;
}

/**
 * Pure predicate: could the player ever pay this requirement given their current
 * resources (ignoring any in-progress picks)?  The ONLY legitimate reason to
 * mark a choice as `data-state="impossible"`.
 */
export function canEverAfford(requirement, resources) {
  if (requirement.length === 0) return true;
  const { satisfied } = runAssignment(requirement, { ...resources });
  return satisfied;
}

/**
 * Describe the gap between what the player picked and what is needed.
 * Used for the aria-live status announcement and the selection-bar hint.
 * Returns { shortage: number, excess: number }.
 */
export function selectionStatus(requirement, picks, resources) {
  for (const [r, count] of Object.entries(picks)) {
    if (count > (resources[r] || 0)) return { shortage: 0, excess: 1 };
  }
  const totalNeed = requirement.reduce((s, i) => s + i.need, 0);
  const totalPicked = Object.values(picks).reduce((a, b) => a + b, 0);
  const { rem, satisfied } = runAssignment(requirement, picks);
  const excess = Object.values(rem).reduce((a, b) => a + b, 0);
  const shortage = satisfied ? 0 : Math.max(0, totalNeed - (totalPicked - excess));
  return { shortage, excess };
}
