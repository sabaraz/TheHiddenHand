const VALID_DESTINATIONS = new Set([
  "discard", "remove", "defer", "return", "upgrade", "brutalize", "stabilize"
]);

const VALID_EFFECT_TYPES = new Set([
  "resource", "pressure", "flag", "opportunityUsed", "deferEvent",
  "startRitual", "startSelectedRitual", "advanceRitual",
  "advanceRitualChance", "ritualFailure", "ritualStabilize", "stabilizeCycle",
  "defeat"
]);

// Derives the set of known ritual path identifiers from events[].ritualPath.
// Only events[] are consulted — mandatory events don't define canonical paths.
export function getKnownRitualPaths(eventPools) {
  const paths = new Set();
  for (const event of (eventPools.events || [])) {
    if (event.ritualPath) paths.add(event.ritualPath);
  }
  return paths;
}

// Returns an array of error strings.  Empty array means valid.
export function validateEventPools(eventPools, rituals) {
  const errors = [];
  const events = eventPools.events || [];
  const mandatory = eventPools.mandatory || [];
  const all = [...events, ...mandatory];

  // Build full ID set for cross-reference checks; detect duplicates in one pass.
  const idSet = new Set();
  const seenForDupe = new Set();
  for (const ev of all) {
    if (seenForDupe.has(ev.id)) {
      errors.push(`Duplicate event id: "${ev.id}"`);
    }
    seenForDupe.add(ev.id);
    idSet.add(ev.id);
  }

  const knownPaths = getKnownRitualPaths(eventPools);
  const knownRitualIds = new Set(Object.keys(rituals || {}));

  for (const ev of all) {
    const loc = `event "${ev.id}"`;

    if (ev.kind === "mandatory" && !ev.trigger) {
      errors.push(`${loc}: mandatory event missing trigger`);
    }

    if (ev.mandatoryPath && !knownPaths.has(ev.mandatoryPath)) {
      errors.push(`${loc}: unknown mandatoryPath "${ev.mandatoryPath}"`);
    }

    if (ev.ritualPath && !knownPaths.has(ev.ritualPath)) {
      errors.push(`${loc}: unknown ritualPath "${ev.ritualPath}"`);
    }

    if (ev.setsRitualPath && !knownPaths.has(ev.setsRitualPath)) {
      errors.push(`${loc}: unknown setsRitualPath "${ev.setsRitualPath}"`);
    }

    if (ev.startsRitualId && !knownRitualIds.has(ev.startsRitualId)) {
      errors.push(`${loc}: unknown startsRitualId "${ev.startsRitualId}"`);
    }

    for (const choice of (ev.choices || [])) {
      const cloc = `${loc} choice "${choice.id}"`;

      if (choice.destination && !VALID_DESTINATIONS.has(choice.destination)) {
        errors.push(`${cloc}: invalid destination "${choice.destination}"`);
      }

      if (choice.upgradeTo && !idSet.has(choice.upgradeTo)) {
        errors.push(`${cloc}: upgradeTo "${choice.upgradeTo}" references unknown event`);
      }

      for (const effect of (choice.effects || [])) {
        if (!VALID_EFFECT_TYPES.has(effect.type)) {
          errors.push(`${cloc}: invalid effect type "${effect.type}"`);
        }

        if (effect.type === "startRitual" && !knownRitualIds.has(effect.ritualId)) {
          errors.push(`${cloc}: startRitual references unknown ritualId "${effect.ritualId}"`);
        }

        if (effect.mirrorsCost !== undefined) {
          if (effect.type !== "resource") {
            errors.push(`${cloc}: mirrorsCost is only valid on "resource" effects, found on "${effect.type}"`);
          } else if (effect.mirrorsCost === true) {
            if (typeof effect.amount !== "number" || effect.amount >= 0) {
              errors.push(`${cloc}: mirrorsCost: true requires amount < 0`);
            }
            const costForResource = choice.cost?.[effect.resource] ?? 0;
            if (costForResource <= 0) {
              errors.push(`${cloc}: mirrorsCost: true requires a matching cost for "${effect.resource}" on the same choice`);
            }
          }
        }
      }
    }
  }

  return errors;
}
