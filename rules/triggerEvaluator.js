const OPS = {
  "<=": (a, b) => a <= b,
  ">=": (a, b) => a >= b,
  "==": (a, b) => a === b,
  "<":  (a, b) => a < b,
  ">":  (a, b) => a > b
};

/**
 * Evaluates a declarative trigger expression against game state.
 * Returns false (never throws) for any invalid or unrecognized input.
 *
 * Supported shapes:
 *   { resource: "Food",  op: "<=", value: 0 }
 *   { resource: "_sum",  op: ">=", value: 15 }
 *   { pressure: true,    op: ">=", value: 2 }
 *   { and: [trigger, ...] }
 *   { or:  [trigger, ...] }
 */
export function evalTrigger(trigger, state) {
  if (!trigger || typeof trigger !== "object" || Array.isArray(trigger)) return false;

  if (Array.isArray(trigger.and)) {
    if (trigger.and.length === 0) return false;
    return trigger.and.every((child) => evalTrigger(child, state));
  }

  if (Array.isArray(trigger.or)) {
    if (trigger.or.length === 0) return false;
    return trigger.or.some((child) => evalTrigger(child, state));
  }

  const fn = OPS[trigger.op];
  if (!fn) return false;
  if (typeof trigger.value !== "number" || !Number.isFinite(trigger.value)) return false;

  if (trigger.pressure === true) {
    return fn(state?.pressure ?? 0, trigger.value);
  }

  if (typeof trigger.resource === "string") {
    const lhs =
      trigger.resource === "_sum"
        ? Object.values(state?.resources ?? {}).reduce((s, v) => s + (Number(v) || 0), 0)
        : Number(state?.resources?.[trigger.resource] ?? 0);
    return fn(lhs, trigger.value);
  }

  return false;
}
