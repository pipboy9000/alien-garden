import { Entity } from "@chickenfart/engine/entitiesFactory";
import { registerPlant } from "../game/state/plantRegistry.js";
import gameplayConfig from "../game/data/gameplay-config.json";

const plantId = "crystal-cactus";

export async function create(x, y) {

    let entity = await Entity.create(x, y, "Cactus");
    entity.tag = "plant";

    const config = gameplayConfig.plants[plantId];
    const level = config.levels[0];

    entity.setState(`level${level.level}`);

    registerPlant(entity, {
        plantId,
        name: config.name,
        level: level.level,
        productionPerSecond: level.productionPerSecond,
        purchaseCost: config.purchaseCost
    });

    return entity;
}
