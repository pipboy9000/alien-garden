// Purchased plants carry their own live x/y (spawned beside the player and freely
// movable afterwards), so resolving a plant record's position is just reading those fields.
export function resolvePlantPosition(record) {
  if (!Number.isFinite(record.x) || !Number.isFinite(record.y)) return null;
  return { x: record.x, y: record.y };
}

// Caps how many plants a greenhouse can hold at once.
export function getMaxPlants(gameplayConfig, greenhouseId) {
  return gameplayConfig.greenhouses?.[greenhouseId]?.maxPlants ?? Infinity;
}

// Each already-owned plant (of any kind) in the greenhouse raises the price of the next
// one, same escalating-cost feel the old per-pot cost ladder had.
export function getPlantPurchaseCost(gameplayConfig, greenhouseId, plantConfig, ownedPlantsCount) {
  const multiplier = gameplayConfig.greenhouses?.[greenhouseId]?.plantCostMultiplier ?? 1;
  return Math.round(plantConfig.purchaseCost * multiplier ** ownedPlantsCount);
}
