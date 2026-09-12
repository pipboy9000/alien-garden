import { addEntity } from '@chickenfart/engine/world';
import { mouse, mousePressed } from '@chickenfart/engine/input';
import { isPointInEntityCollision } from '@chickenfart/engine/collision';
import { setWalkTarget, getWalkTarget } from '../state/navigationState.js';
import { hoverOverSelectable } from './selection.js';

const MARKER_RADIUS = 6;

// The engine treats floor items (like the greenhouse background) as pure background
// decoration: it never registers their collision shape for hit-testing. So we resolve
// the floor entity's world-space rhombus ourselves, once, from the level + resource JSON.
async function loadFloorShape(levelId, floorEntityName) {
  const [levelJson, resourceJson] = await Promise.all([
    fetch(`levels/${levelId}.json`).then((res) => res.json()),
    fetch(`src/entities/resources/${floorEntityName}/${floorEntityName}.json`).then((res) => res.json())
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
  const floorShape = await loadFloorShape(levelId, floorEntityName);
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

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.arc(target.x, target.y, MARKER_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
    update() {
      if (!mousePressed.left) return;
      if (hoverOverSelectable) return;
      if (!isPointInEntityCollision(floorShape, mouse.worldX, mouse.worldY)) return;

      setWalkTarget(mouse.worldX, mouse.worldY);
    }
  });
}
