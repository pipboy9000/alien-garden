import { setCamTarget, setCamPos } from "@chickenfart/engine/canvas";
import { keyboard, keyPressed } from "@chickenfart/engine/input";
import { addEntity } from "@chickenfart/engine/world";
import * as Smoke from "./SmokePuff.js";
import { Entity } from "@chickenfart/engine/entitiesFactory";

export async function create(x, y) {

    let entity = await Entity.create(x, y, "Player");
    entity.tag = "player";

    let speed = 2;
    let vx = 0;
    let vy = 0;
    let vz = 0;

    setCamPos(x, y);

    entity.onUpdate = async (dt) => {

        if (keyboard.ArrowLeft || keyboard.KeyA) {
            vx -= speed;
            entity.setFlipX(true);
        }

        if (keyboard.ArrowRight || keyboard.KeyD) {
            vx += speed;
            entity.setFlipX(false);
        }

        if (keyboard.ArrowUp || keyboard.KeyW) {
            vy -= speed;
        }

        if (keyboard.ArrowDown || keyboard.KeyS) {
            vy += speed;
        }

        if (keyPressed.Space && entity.z === 0) {
            vz = 1;
            entity.setState("jump");
            let puff = await Smoke.create(entity.x, entity.y);
            addEntity(puff);
            setTimeout(() => {
                entity.setState("idle");
            }, 400);
        }

        vx *= 0.8;
        vy *= 0.8;
        vz -= 0.08;

        let len = Math.sqrt(vx * vx + vy * vy);
        if (len > speed) {
            vx = (vx / len) * speed;
            vy = (vy / len) * speed;
        }

        entity.x += vx;
        entity.y += vy;
        entity.z += vz;

        if (Math.abs(vx) < 0.01) vx = 0;
        if (Math.abs(vy) < 0.01) vy = 0;
        if (entity.z < 0) {
            entity.z = 0;
            vz = 0;
        }

        setCamTarget(entity.x, entity.y);

        if (entity.z === 0) {
            entity.setState(vx !== 0 || vy !== 0 ? "run" : "idle");
            entity.animFrameDelay = 100;
        }
    }

    return entity;
}
