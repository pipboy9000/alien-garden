// Engine-independent offline/idle catch-up: fast-forwards wallet crystals earned by
// each plant's productionPerSecond since the last save, per docs/game-design.md section 8.
// Does NOT touch the physical crystal-pickup mechanic (crystalDropRatePerSecond) -
// that only runs while the game is actively open.

function getPlantCondition(record, plantConfig, careConfig, now) {
  if (!record.alive) return 'dead';
  if (!record.wateredAt) return 'healthy';

  const dryAtMs = record.wateredAt + plantConfig.waterIntervalSeconds * 1000;
  if (now < dryAtMs) return 'healthy';

  const deathAtMs = dryAtMs + plantConfig.deathAfterDrySeconds * 1000;
  if (now >= deathAtMs) return 'dead';

  return 'dry';
}

// Returns a new gameState with crystals/plant conditions fast-forwarded, plus how many
// crystals were gained (for the return-to-game summary).
export function applyOfflineProduction(gameState, gameplayConfig, now = Date.now()) {
  const maxAwayMs = gameplayConfig.offline.maxAwaySeconds * 1000;
  const terminalAbsenceMs = gameplayConfig.offline.terminalAbsenceSeconds * 1000;
  const elapsedMs = Math.min(Math.max(now - gameState.lastSavedAt, 0), maxAwayMs);
  const terminal = now - gameState.lastSavedAt >= terminalAbsenceMs;
  const elapsedSeconds = elapsedMs / 1000;

  const greenhouseId = gameState.lastVisitedGreenhouseId;
  const greenhouseState = gameState.greenhouses[greenhouseId];
  if (!greenhouseState) return { gameState, crystalsGained: 0 };

  let crystalsGained = 0;
  const plants = greenhouseState.plants.map((record) => {
    if (!record.plantId || !record.alive) return record;

    if (terminal) {
      return { ...record, alive: false };
    }

    const plantConfig = gameplayConfig.plants[record.plantId];
    if (!plantConfig) return record;

    const condition = getPlantCondition(record, plantConfig, gameplayConfig.care, now);
    if (condition === 'dead') return { ...record, alive: false };

    const level = plantConfig.levels[record.level - 1];
    const rate = level.productionPerSecond * (condition === 'dry' ? gameplayConfig.care.dryProductionMultiplier : 1);
    const capacity = plantConfig.pendingCapacity ?? Infinity;
    crystalsGained += Math.min(rate * elapsedSeconds, capacity);

    return record;
  });

  const nextGameState = {
    ...gameState,
    crystals: gameState.crystals + crystalsGained,
    greenhouses: {
      ...gameState.greenhouses,
      [greenhouseId]: { ...greenhouseState, plants }
    }
  };

  return { gameState: nextGameState, crystalsGained };
}
