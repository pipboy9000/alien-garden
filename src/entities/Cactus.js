import { Entity } from "@chickenfart/engine/entitiesFactory";
import { addEntity } from "@chickenfart/engine/world";
import { registerSelectable } from "../game/state/selectableRegistry.js";
import { isSelectableHovered } from "../game/systems/selection.js";
import { getSelectedItem } from "../game/state/selectionState.js";
import * as Crystal from "./Crystal.js";
import * as FloatingNumber from "./FloatingNumber.js";
import gameplayConfig from "../game/data/gameplay-config.json";
import { ParticleSystem } from "@chickenfart/engine";

const plantId = "crystal-cactus";

// Cosmetic wallet-pulse timing, randomized per plant so multiple plants don't pulse in sync.
const PULSE_MIN_SECONDS = 2.5;
const PULSE_MAX_SECONDS = 4.5;

function randomPulseIntervalMs() {
    return (PULSE_MIN_SECONDS + Math.random() * (PULSE_MAX_SECONDS - PULSE_MIN_SECONDS)) * 1000;
}

export async function create(x, y, level = 1, onCrystalCollected, getProductionRate) {

    let entity = await Entity.create(x, y, "Cactus");
    entity.tag = "plant";

    //particle system for the cactus
    let ps = new ParticleSystem(40);
    ps.gravity = 0;
    ps.speed = 0.15;
    ps.delay = 175;
    ps.maxParticleAge = 100;
    ps.on = true;
    ps.speed = 0.01;
    ps.gravity = 0;
    ps.maxParticleAge = 100;
    ps.onParticleSpawn = (particle) => {
        particle.z = -60;
        particle.x = entity.x + (Math.random() - 0.5) * 60;
        particle.y = entity.y + (Math.random() - 0.5) * 60;
        particle.vx = 0;
        particle.vy = 0;
        particle.vz = -20;
    };
    ps.onDrawParticle = (ctx, particle) => {
        // ctx.fillStyle = "#44ff44cc";
        ctx.beginPath();
        const radialGradient = ctx.createRadialGradient(particle.x, particle.y + particle.z, 0, particle.x, particle.y + particle.z, 4);
        radialGradient.addColorStop(0, "#ffffffcc");
        radialGradient.addColorStop(1, "#ff44ff00");
        ctx.fillStyle = radialGradient;
        ctx.arc(particle.x, particle.y + particle.z, 4, 0, 2 * Math.PI);
        ctx.fill();
    };
    addEntity(ps);

    const config = gameplayConfig.plants[plantId];
    let levelConfig = config.levels[level - 1];

    entity.setState(`level${levelConfig.level}`);

    registerSelectable(entity, {
        type: "plant",
        plantId,
        name: config.name,
        level: levelConfig.level,
        productionPerSecond: levelConfig.productionPerSecond,
        purchaseCost: config.purchaseCost
    });

    // Called by main.js after a paid level-up; re-reads the config so drop rate/sprite state update live.
    entity.setLevel = (newLevel) => {
        levelConfig = config.levels[newLevel - 1];
        entity.setState(`level${levelConfig.level}`);
    };

    let dropTimerMs = 0;
    let activeCrystalsCount = 0;
    const maxCrystals = config.pendingCapacity ?? 50;

    let pulseTimerMs = 0;
    let pulseIntervalMs = randomPulseIntervalMs();

    entity.onUpdate = async (dt) => {
        if (!document.hasFocus() || document.hidden) return;

        ps.x = entity.x;
        ps.y = entity.y + 1;

        pulseTimerMs += dt;
        if (pulseTimerMs >= pulseIntervalMs) {
            const elapsedSeconds = pulseTimerMs / 1000;
            pulseTimerMs = 0;
            pulseIntervalMs = randomPulseIntervalMs();

            const ratePerSecond = getProductionRate?.() ?? levelConfig.productionPerSecond;
            const amount = ratePerSecond * elapsedSeconds;
            if (amount > 0) {
                entity.flash(200, "purple");
                const label = await FloatingNumber.create(entity.x, entity.y + 1, `+${amount.toFixed(1)}`);
                addEntity(label);
            }
        }

        const dropRatePerSecond = levelConfig.crystalDropRatePerSecond;
        if (!dropRatePerSecond) return;

        if (activeCrystalsCount >= maxCrystals) return;

        const dropIntervalMs = 1000 / dropRatePerSecond;
        dropTimerMs += dt;

        if (dropTimerMs >= dropIntervalMs) {
            dropTimerMs -= dropIntervalMs;
            activeCrystalsCount++;
            const crystal = await Crystal.create(entity.x, entity.y, (collectedCrystal) => {
                activeCrystalsCount = Math.max(0, activeCrystalsCount - 1);
                onCrystalCollected?.(collectedCrystal);
            });
            addEntity(crystal);
        }
    };

    entity.onDrawBehind = (ctx) => {
        if (isSelectableHovered(entity)) {
            ctx.beginPath();
            ctx.fillStyle = "#44ff44cc";
            ctx.lineWidth = 2;
            ctx.ellipse(entity.x, entity.y, 50, 25, 0, 0, 2 * Math.PI);
            ctx.fill();
        } else if (getSelectedItem()?.entity === entity) {
            ctx.beginPath();
            ctx.fillStyle = "#44ff4488";
            ctx.lineWidth = 2;
            ctx.ellipse(entity.x, entity.y, 50, 25, 0, 0, 2 * Math.PI);
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
