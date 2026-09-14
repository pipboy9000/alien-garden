const SAVE_KEY = 'alien-garden:save';
const SAVE_VERSION = 2;

function createDefaultGameState() {
  return {
    schemaVersion: SAVE_VERSION,
    crystals: 0,
    globalUpgrades: {},
    lastVisitedGreenhouseId: 'greenhouse-01',
    lastSavedAt: Date.now(),
    lastProductionSettledAt: Date.now(),
    greenhouses: {
      'greenhouse-01': {
        unlocked: true,
        plants: []
      }
    }
  };
}

function migrateGameState(value) {
  if (value.schemaVersion === 1 && Number.isFinite(value.lastSavedAt)) {
    return {
      ...value,
      schemaVersion: SAVE_VERSION,
      lastProductionSettledAt: value.lastSavedAt
    };
  }

  return value;
}

function isValidGameState(value) {
  return Boolean(
    value &&
      value.schemaVersion === SAVE_VERSION &&
      Number.isFinite(value.crystals) &&
      typeof value.lastVisitedGreenhouseId === 'string' &&
      Number.isFinite(value.lastSavedAt) &&
      Number.isFinite(value.lastProductionSettledAt) &&
      value.greenhouses &&
      typeof value.greenhouses === 'object'
  );
}

export function loadGameState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    const migrated = migrateGameState(saved);
    return isValidGameState(migrated) ? migrated : createDefaultGameState();
  } catch {
    return createDefaultGameState();
  }
}

export function saveGameState(gameState) {
  const nextState = {
    ...gameState,
    schemaVersion: SAVE_VERSION,
    lastSavedAt: Date.now()
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(nextState));
  } catch {
  }

  return nextState;
}

export function resetGameState() {
  return createDefaultGameState();
}
