const SAVE_KEY = 'alien-garden:save';
const SAVE_VERSION = 1;

function createDefaultGameState() {
  return {
    schemaVersion: SAVE_VERSION,
    crystals: 0,
    lastVisitedGreenhouseId: 'greenhouse-01',
    lastSavedAt: Date.now(),
    greenhouses: {
      'greenhouse-01': {
        unlocked: true,
        plants: []
      }
    }
  };
}

function isValidGameState(value) {
  return Boolean(
    value &&
      value.schemaVersion === SAVE_VERSION &&
      Number.isFinite(value.crystals) &&
      typeof value.lastVisitedGreenhouseId === 'string' &&
      Number.isFinite(value.lastSavedAt) &&
      value.greenhouses &&
      typeof value.greenhouses === 'object'
  );
}

export function loadGameState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return isValidGameState(saved) ? saved : createDefaultGameState();
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
