import { addEntity } from '@chickenfart/engine/world';
import { mouse, mousePressed } from '@chickenfart/engine/input';
import { getPlants } from '../state/plantRegistry.js';
import { selectPlant, clearSelection } from '../state/selectionState.js';

const SELECTION_RADIUS = 30;
const SELECTION_RADIUS_SQR = SELECTION_RADIUS * SELECTION_RADIUS;

// Non-visual system entity: picks the closest plant within range of a click, anywhere on the stage.
export function initPlantSelectionSystem() {
  addEntity({
    x: 0,
    y: 0,
    active: true,
    draw() {},
    update() {
      if (!mousePressed.left) return;

      let closestPlant = null;
      let closestDistSqr = SELECTION_RADIUS_SQR;

      for (const plant of getPlants()) {
        const dx = plant.entity.x - mouse.worldX;
        const dy = plant.entity.y - mouse.worldY;
        const distSqr = dx * dx + dy * dy;

        if (distSqr <= closestDistSqr) {
          closestDistSqr = distSqr;
          closestPlant = plant;
        }
      }

      if (closestPlant) {
        selectPlant(closestPlant.info);
      } else {
        clearSelection();
      }
    }
  });
}
