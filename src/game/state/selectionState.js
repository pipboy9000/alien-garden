// Ephemeral UI selection state: not persisted, separate from the saved gameState.
// The selected item's `info` shape varies by `type` (e.g. "plant").
let selectedItem = null;
const listeners = new Set();

export function selectItem(item) {
  selectedItem = item;
  notify();
}

export function clearSelection() {
  selectedItem = null;
  notify();
}

export function getSelectedItem() {
  return selectedItem;
}

export function onSelectionChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  for (const callback of listeners) {
    callback(selectedItem);
  }
}

