// Ephemeral "move plant" placement mode: not persisted, separate from selectionState.
// While set, floor clicks relocate `entity` instead of walking/selecting.
let placementTarget = null;
const listeners = new Set();

export function startPlacement(entity, slotId) {
  placementTarget = { entity, slotId };
  entity.opacity = 0.5;
  notify();
}

export function cancelPlacement() {
  if (placementTarget) placementTarget.entity.opacity = 1;
  placementTarget = null;
  notify();
}

export function getPlacementTarget() {
  return placementTarget;
}

export function onPlacementChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  for (const callback of listeners) {
    callback(placementTarget);
  }
}
