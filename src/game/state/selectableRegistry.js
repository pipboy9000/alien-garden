// Live registry of selectable entities (plants, empty pots, etc.), rebuilt on every level load.
// `info` must include a `type` field so consumers (UI, click handlers) can branch on it.
const selectables = [];

export function registerSelectable(entity, info) {
  selectables.push({ entity, info });
}

export function unregisterSelectable(entity) {
  const index = selectables.findIndex((item) => item.entity === entity);
  if (index !== -1) selectables.splice(index, 1);
}

export function getSelectables() {
  return selectables;
}

export function clearSelectables() {
  selectables.length = 0;
}
