import { getPlantConditionForProduction, getPlantProductionRate } from './production.js';

// Returns a new gameState with crystals/plant conditions fast-forwarded, plus how many
// crystals were gained (for the return-to-game summary).
export function applyOfflineProduction(gameState, gameplayConfig, now = Date.now()) {
  const maxAwayMs = gameplayConfig.offline.maxAwaySeconds * 1000;
  const terminalAbsenceMs = gameplayConfig.offline.terminalAbsenceSeconds * 1000;
  const elapsedMs = Math.min(Math.max(now - gameState.lastProductionSettledAt, 0), maxAwayMs);
  const terminal = now - gameState.lastProductionSettledAt >= terminalAbsenceMs;
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

    const condition = getPlantConditionForProduction(record, gameplayConfig, now);
    if (condition === 'dead') return { ...record, alive: false };

    crystalsGained += getPlantProductionRate(gameState, record, gameplayConfig, now) * elapsedSeconds;

    return record;
  });

  const nextGameState = {
    ...gameState,
    crystals: gameState.crystals + crystalsGained,
    lastProductionSettledAt: now,
    greenhouses: {
      ...gameState.greenhouses,
      [greenhouseId]: { ...greenhouseState, plants }
    }
  };

  return { gameState: nextGameState, crystalsGained };
}
