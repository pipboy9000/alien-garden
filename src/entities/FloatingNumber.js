import { Entity } from "@chickenfart/engine/entitiesFactory";
import { removeEntity } from "@chickenfart/engine/world";

const LIFETIME_MS = 1000;
const RISE_PX = 40;

// Purely cosmetic: displays a rising/fading "+X" label. Never touches gameState itself.
export async function create(x, y, text, color = "#7CFC98") {

    let entity = await Entity.create(x, y, "FloatingNumber");
    entity.visible = true;
    entity.z = 100;

    let ageMs = 0;

    entity.onUpdate = (dt) => {
        ageMs += dt;
        if (ageMs >= LIFETIME_MS) {
            removeEntity(entity);
        }
    };

    entity.onDraw = (ctx) => {
        const t = Math.min(ageMs / LIFETIME_MS, 1);
        const riseY = entity.y - t * RISE_PX;
        const alpha = 1 - t;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#00000099";
        ctx.strokeText(text, entity.x, riseY);
        ctx.fillStyle = color;
        ctx.fillText(text, entity.x, riseY);
        ctx.restore();
    };

    return entity;
}
