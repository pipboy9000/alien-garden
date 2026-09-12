import { addEntity } from '@chickenfart/engine/world';
import { mouse, mousePressed } from '@chickenfart/engine/input';
import { getSelectables } from '../state/selectableRegistry.js';
import { selectItem, clearSelection } from '../state/selectionState.js';

export const SELECTION_RADIUS = 30;
export const SELECTION_RADIUS_SQR = SELECTION_RADIUS * SELECTION_RADIUS;

export let hoverOverSelectable = null;

export function getHoverOverSelectable() {
  return hoverOverSelectable;
}

export function isSelectableHovered(entity) {
  if (!hoverOverSelectable) return false;
  return hoverOverSelectable.entity === entity || hoverOverSelectable === entity;
}

// Non-visual system entity: picks the closest selectable within range of a click, anywhere on the stage.
export function initSelectionSystem() {
  addEntity({
    x: 0,
    y: 0,
    active: true,
    draw() {},
    update() {
      let closest = null;
      let closestDistSqr = SELECTION_RADIUS_SQR;

      for (const item of getSelectables()) {
        const dx = item.entity.x - mouse.worldX;
        const dy = item.entity.y - mouse.worldY;
        const distSqr = dx * dx + dy * dy;

        if (distSqr <= closestDistSqr) {
          closestDistSqr = distSqr;
          closest = item;
        }
      }

      hoverOverSelectable = closest;

      if (mousePressed.left) {
        if (closest) {
          selectItem({ ...closest.info, entity: closest.entity });
        } else {
          clearSelection();
        }
      }
    }
  });
}

