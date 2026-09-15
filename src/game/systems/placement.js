import { addEntity } from '@chickenfart/engine/world';
import { mouse, mousePressed, keyPressed } from '@chickenfart/engine/input';
import { getPlacementTarget, cancelPlacement } from '../state/placementState.js';
import { isPointOnFloor } from './floorNavigation.js';

const MARKER_RADIUS = 22;

// Lets the player click the floor to relocate whichever plant is currently in placement mode.
export function initPlacementSystem({ onPlace, onCancel }) {
  addEntity({
    x: 0,
    y: 0,
    active: true,
    draw(ctx) {
      const target = getPlacementTarget();
      if (!target) return;

      const onFloor = isPointOnFloor(mouse.worldX, mouse.worldY);
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = onFloor ? 'rgba(168, 213, 140, 0.9)' : 'rgba(255, 107, 107, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.arc(mouse.worldX, mouse.worldY, MARKER_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
    update() {
      const target = getPlacementTarget();
      if (!target) return;

      if (keyPressed.Escape) {
        cancelPlacement();
        onCancel?.(target);
        return;
      }

      if (!mousePressed.left) return;
      if (!isPointOnFloor(mouse.worldX, mouse.worldY)) return;

      target.entity.x = mouse.worldX;
      target.entity.y = mouse.worldY;
      onPlace(target, mouse.worldX, mouse.worldY);
      cancelPlacement();
    }
  });
}
