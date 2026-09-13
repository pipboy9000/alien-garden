import { Entity } from "@chickenfart/engine/entitiesFactory";
import { registerSelectable } from "../game/state/selectableRegistry.js";
import { isSelectableHovered } from "../game/systems/selection.js";
import gameplayConfig from "../game/data/gameplay-config.json";

const plantId = "crystal-cactus";

export async function create(x, y) {

    let entity = await Entity.create(x, y, "Cactus");
    entity.tag = "plant";

    const config = gameplayConfig.plants[plantId];
    const level = config.levels[0];

    entity.setState(`level${level.level}`);

    registerSelectable(entity, {
        type: "plant",
        plantId,
        name: config.name,
        level: level.level,
        productionPerSecond: level.productionPerSecond,
        purchaseCost: config.purchaseCost
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

    entity.onDraw = (ctx) => {
    
        switch (entity.currState) {
            case 'level1':
                // Draw logic for level 1 cactus
                let gradient = ctx.createRadialGradient(entity.x, entity.y - 75, Math.random() * 5 + 2, entity.x, entity.y - 75, Math.random() * 20 + 10);
                gradient.addColorStop(0, "#ffffff44");
                gradient.addColorStop(1, "#ff44ff00");
                ctx.fillStyle = gradient;
                // ctx.fillStyle = 'red';
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillRect(entity.x - 25, entity.y - 100, 50, 50);
                break;
            case 'level2':
                // Draw logic for level 2 cactus
                break;
            case 'level3':
                // Draw logic for level 3 cactus
                break;
            case 'level4':
                // Draw logic for level 4 cactus
                break;
            default:
                // Draw logic for default cactus state
                break;
        }

    
    }

    return entity;
}
