// Ephemeral UI selection state: not persisted, separate from the saved gameState.
let selectedPlant = null;
const listeners = new Set();

export function selectPlant(plant) {
  selectedPlant = plant;
  notify();
}

export function clearSelection() {
  selectedPlant = null;
  notify();
}

export function getSelectedPlant() {
  return selectedPlant;
}

export function onSelectionChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  for (const callback of listeners) {
    callback(selectedPlant);
  }
}
