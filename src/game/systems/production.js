function getPlantCondition(record, plantConfig, now) {
  if (!record.alive) return 'dead';
  if (!record.wateredAt) return 'healthy';

  const dryAtMs = record.wateredAt + plantConfig.waterIntervalSeconds * 1000;
  if (now < dryAtMs) return 'healthy';

  const deathAtMs = dryAtMs + plantConfig.deathAfterDrySeconds * 1000;
  if (now >= deathAtMs) return 'dead';

  return 'dry';
}

export function getGlobalProductionMultiplier(gameState, gameplayConfig) {
  return Object.entries(gameState.globalUpgrades ?? {}).reduce((multiplier, [upgradeId, purchaseCount]) => {
    const upgrade = gameplayConfig.globalUpgrades?.[upgradeId];
    if (!upgrade || !Number.isFinite(purchaseCount) || purchaseCount < 1) return multiplier;

    return multiplier * Math.pow(upgrade.productionMultiplier ?? 1, purchaseCount);
  }, 1);
}

export function getPlantProductionRate(gameState, plantRecord, gameplayConfig, now = Date.now()) {
  if (!plantRecord.plantId || !plantRecord.alive) return 0;

  const plantConfig = gameplayConfig.plants[plantRecord.plantId];
  const levelConfig = plantConfig?.levels[plantRecord.level - 1];
  if (!plantConfig || !levelConfig) return 0;

  const condition = getPlantCondition(plantRecord, plantConfig, now);
  if (condition === 'dead') return 0;

  const conditionMultiplier = condition === 'dry'
    ? gameplayConfig.care.dryProductionMultiplier
    : 1;

  return levelConfig.productionPerSecond * conditionMultiplier * getGlobalProductionMultiplier(gameState, gameplayConfig);
}

export function settleProduction(gameState, gameplayConfig, now = Date.now()) {
  const elapsedSeconds = Math.max(now - gameState.lastProductionSettledAt, 0) / 1000;
  const greenhouseId = gameState.lastVisitedGreenhouseId;
  const greenhouseState = gameState.greenhouses[greenhouseId];
  if (!greenhouseState) {
    return { gameState: { ...gameState, lastProductionSettledAt: now }, crystalsGained: 0 };
  }

  const crystalsGained = greenhouseState.plants.reduce(
    (total, plantRecord) => total + getPlantProductionRate(gameState, plantRecord, gameplayConfig, now) * elapsedSeconds,
    0
  );

  return {
    gameState: {
      ...gameState,
      crystals: gameState.crystals + crystalsGained,
      lastProductionSettledAt: now
    },
    crystalsGained
  };
}

export function getPlantConditionForProduction(record, gameplayConfig, now = Date.now()) {
  const plantConfig = gameplayConfig.plants[record.plantId];
  return plantConfig ? getPlantCondition(record, plantConfig, now) : 'dead';
}