const COMMON_RESOURCES = ["Money", "Food", "Cultists", "Prisoners"];

export function getVisibleCost(option, ritualCost = null) {
  const cost = option.usesRitualCost ? ritualCost : option.cost;
  return cost || {};
}

export function hasResourcesForCost(resources, cost = {}, allowRelicSubstitution = false) {
  const availableHumanPower = (resources.Cultists || 0) + (resources.Prisoners || 0);
  let relicsAvailable = resources.Relics || 0;

  for (const [resource, amount] of Object.entries(cost)) {
    if (amount <= 0) continue;
    if (resource === "humanPower") {
      if (availableHumanPower < amount) return false;
      continue;
    }
    if (resource === "Suspicion") {
      if ((resources.Suspicion || 0) < amount) return false;
      continue;
    }
    const have = resources[resource] || 0;
    if (have >= amount) continue;
    const deficit = amount - have;
    if (!allowRelicSubstitution || !COMMON_RESOURCES.includes(resource) || relicsAvailable < deficit) {
      return false;
    }
    relicsAvailable -= deficit;
  }

  return true;
}

export function payCost(resources, cost = {}, allowRelicSubstitution = false) {
  const spent = {};

  for (const [resource, amount] of Object.entries(cost)) {
    if (amount <= 0) continue;
    if (resource === "humanPower") {
      const prisonersSpent = Math.min(resources.Prisoners, amount);
      resources.Prisoners -= prisonersSpent;
      resources.Cultists -= amount - prisonersSpent;
      spent.Prisoners = (spent.Prisoners || 0) + prisonersSpent;
      spent.Cultists = (spent.Cultists || 0) + amount - prisonersSpent;
      continue;
    }

    const directSpend = Math.min(resources[resource] || 0, amount);
    resources[resource] = (resources[resource] || 0) - directSpend;
    spent[resource] = (spent[resource] || 0) + directSpend;

    const deficit = amount - directSpend;
    if (deficit > 0 && allowRelicSubstitution && COMMON_RESOURCES.includes(resource)) {
      resources.Relics -= deficit;
      spent.Relics = (spent.Relics || 0) + deficit;
    }
  }

  return spent;
}

export function formatCost(cost = {}, allowRelicSubstitution = false) {
  const parts = Object.entries(cost)
    .filter(([, amount]) => amount > 0)
    .map(([resource, amount]) => {
      const label = resource === "humanPower" ? "Cultists/Prisoners" : resource;
      return `${amount} ${label}`;
    });

  if (allowRelicSubstitution && parts.length) {
    parts.push("Relics can cover common shortages");
  }

  return parts.length ? parts.join(", ") : "No direct cost";
}
