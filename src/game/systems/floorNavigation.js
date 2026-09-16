import { addEntity, getEntityByTag } from '@chickenfart/engine/world';
import { mouse, mousePressed } from '@chickenfart/engine/input';
import { isPointInEntityCollision } from '@chickenfart/engine/collision';
import { setWalkTarget, getWalkTarget } from '../state/navigationState.js';
import { getPlacementTarget } from '../state/placementState.js';
import { hoverOverSelectable } from './selection.js';

const MARKER_RADIUS = 6;

let floorShape = null;

// Shared with the placement system so it can validate drop points against the same floor bounds.
export function isPointOnFloor(x, y) {
  return floorShape ? isPointInEntityCollision(floorShape, x, y) : false;
}

// The engine treats floor items (like the greenhouse background) as pure background
// decoration: it never registers their collision shape for hit-testing. So we resolve
// the floor entity's world-space rhombus ourselves, once, from the level + resource JSON.
async function loadFloorShape(levelId, floorEntityName) {
  const [levelJson, resourceJson] = await Promise.all([
    fetch(`levels/${levelId}.json`).then((res) => res.json()),
    fetch(`entities/resources/${floorEntityName}/${floorEntityName}.json`).then((res) => res.json())
  ]);

  const floorEntity = levelJson.entities.find((ent) => ent.name === floorEntityName);
  if (!floorEntity || !resourceJson.collision) return null;

  return {
    x: floorEntity.x,
    y: floorEntity.y,
    scale: floorEntity.scale,
    collision: resourceJson.collision
  };
}

export async function initFloorNavigationSystem({ levelId, floorEntityName }) {
  floorShape = await loadFloorShape(levelId, floorEntityName);
  if (!floorShape) {
    console.warn(`Floor navigation: no collision found for "${floorEntityName}", click-to-walk disabled.`);
    return;
  }

  addEntity({
    x: 0,
    y: 0,
    active: true,
    draw(ctx) {
      const target = getWalkTarget();
      if (!target) return;
      const player = getEntityByTag('player');

      ctx.save();
      if (player) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.arc(target.x, target.y, MARKER_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
    update() {
      if (!mousePressed.left) return;
      if (getPlacementTarget()) return;
      if (hoverOverSelectable) return;
      if (!isPointInEntityCollision(floorShape, mouse.worldX, mouse.worldY)) return;

      setWalkTarget(mouse.worldX, mouse.worldY);
    }
  });
}
