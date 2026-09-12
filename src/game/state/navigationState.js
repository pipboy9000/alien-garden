// Ephemeral click-to-walk target for the player, not persisted.
let walkTarget = null;

export function setWalkTarget(x, y) {
  walkTarget = { x, y };
}

export function clearWalkTarget() {
  walkTarget = null;
}

export function getWalkTarget() {
  return walkTarget;
}
