import { Entity } from "@chickenfart/engine/entitiesFactory";
import { registerSelectable } from "../game/state/selectableRegistry.js";
import { isSelectableHovered } from "../game/systems/selection.js";

export async function create(x, y) {

    let entity = await Entity.create(x, y, "EmptyPot");
    entity.tag = "empty-pot";

    entity.setState("idle");

    registerSelectable(entity, {
        type: "empty-pot"
    });

    entity.onDrawBehind = (ctx) => {
        if (isSelectableHovered(entity)) {
            ctx.beginPath();
            ctx.fillStyle = "#44ff4488";
            ctx.lineWidth = 2;
            ctx.ellipse(entity.x, entity.y, 25, 12.5, 0, 0, 2 * Math.PI);
            ctx.fill();
        }
    };

    return entity;
}

