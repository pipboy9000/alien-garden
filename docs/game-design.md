# Alien Garden - Game Design Document

This document describes the intended player experience and the rules of the game.
It is the design source of truth for mechanics. Code and data files are the source
of truth for exact implementation values once a mechanic has been built.

## 1. Game Overview

Alien Garden is an offline isometric idle/caretaking game. The player is an alien
who grows strange crystal-producing plants inside a series of greenhouses.

The game combines two rhythms:

- **Active care:** walking around the greenhouse, watering plants, cleaning them,
    grooming them, harvesting crystals, and deciding what to upgrade.
- **Passive growth:** plants continue to develop and produce crystals while the
    game is closed. The player returns to collect the results and handle any care
    that became due.

The player begins with one small greenhouse and gradually unlocks additional
greenhouses, plants, slots, items, and upgrades.

## 2. Design Pillars

1. **A living garden:** Plants should feel like things the player looks after,
     not only income-generating buttons.
2. **Quiet progression:** The player should make meaningful progress in short
     visits without needing constant attention.
3. **Readable decisions:** Plant condition, production, costs, and upgrade
     effects should be easy to understand at a glance.
4. **Alien wonder:** Plants, crystals, greenhouse themes, and visual effects
     should feel unfamiliar while remaining warm and inviting.
5. **Small-space strategy:** A greenhouse has limited slots, so choosing what to
     grow should matter.

## 3. Core Gameplay Loop

1. Open the game and receive an offline-progress summary.
2. Inspect each greenhouse and identify plants that need attention.
3. Walk to plants or select them directly.
4. Water, clean, groom, or harvest plants as needed.
5. Spend crystals on plants, plant upgrades, items, and greenhouse progression.
6. Arrange the available slots to improve the garden's production and upkeep.
7. Leave the game; plants continue to simulate from the saved timestamp.

The loop should work both as a short visit of roughly one to five minutes and as
a longer session where the player reorganizes and optimizes the garden.

## 4. World and Greenhouses

The world is divided into unlockable greenhouses. The first greenhouse is
available from the beginning. Each later greenhouse introduces a new environment
and expands the player's options.

Each greenhouse has:

- A distinct visual theme and layout.
- A fixed number of plant/item slots.
- Its own set of unlocked or preferred plants.
- A progression requirement and crystal cost to unlock.
- A clear state showing which slots are empty, occupied, blocked, or damaged.

Greenhouses are purchased with crystals. The next greenhouse is unavailable
until the player has saved enough crystals to pay its unlock cost. Unlocking a
greenhouse also unlocks the next group of plant definitions that can be bought.
The unlock is permanent once purchased.

### Proposed greenhouse progression

| ID | Greenhouse | Role | Unlock condition |
| --- | --- | --- | --- |
| `greenhouse-01` | Starter greenhouse | Teaches planting and basic care | Available at start |
| `greenhouse-02` | To be designed | Introduces the next major mechanic | To be decided |
| `greenhouse-03` | To be designed | Provides a later-game specialization | To be decided |

The number of greenhouses and their final themes are not decided yet. New
greenhouses should add a new decision or play pattern, not only a larger number
of slots.

## 5. Plants and Items

Plants are the primary production units. Other items may occupy slots and modify
the garden, provide utility, or create special interactions.

Every plant should have:

- A stable ID, name, description, and visual identity.
- A purchase cost.
- Growth or production statistics by level.
- Care requirements and condition states.
- A crystal production rate.
- A maximum level or another clear upgrade limit.
- A role that distinguishes it from other plants.

Current plant IDs are `star-fern`, `crystal-cactus`, and `glow-mushroom`.

### Plant condition

The intended condition states are:

| State | Cause | Production effect | Player response |
| --- | --- | --- | --- |
| Healthy | Plant is watered and has no active care penalty | Normal production | Maintain the plant |
| Dry | Plant has not been watered for three hours | 50% production | Water the plant |
| Dead | Plant has remained unwatered for too long | No production; slot is blocked | Clean up the plant |

Plants do not have a separate untidy or withered state in the first version.
Grooming is a positive temporary boost rather than a maintenance requirement.
Plants die 48 hours after entering the dry state if they are not watered. The
watering interval and death threshold remain balance values in the JSON
configuration described below.

Plants can die permanently. A dead plant cannot be revived, harvested, moved, or
upgraded. **Clean up** is its only available action. Once cleanup completes, the
slot becomes empty and a new plant can be placed there.

### Care actions

- **Water:** Takes five seconds to complete and resets the plant's watering
    timer. The player may water a plant whenever they choose, including before it
    enters the dry state.
- **Groom:** Applies a one-hour care boost that increases crystal production by
    20%. Grooming again while the boost is active refreshes its duration rather
    than stacking the multiplier.
- **Clean up:** Removes a dead plant from a slot. This is not available while
    the plant is alive.
- **Collect:** Happens automatically when the player passes within collection
    range of a plant with pending crystals. The player does not need to stop or
    press a button.

Care actions should have clear feedback, a short interaction time or animation,
and a visible reason to perform them. Watering is required for survival;
grooming is optional and rewards active visits. Care does not consume crystals in
the first version. The five-second watering action should show progress and may
be interrupted if the player moves away or starts another interaction.

## 6. Crystal Economy

Crystals are the main currency. Plants generate crystals over time, and the
player manually collects them by walking near individual plants. Collection
triggers a particle effect showing crystals flying from the plant to the player.

Crystals can be spent on:

- Buying new plants.
- Upgrading individual plants.
- Buying care tools or useful items.
- Unlocking greenhouse slots.
- Unlocking new greenhouses.
- Purchasing global upgrades.

### Economy rules

- Production continues while the game is closed, subject to the weekly absence
    rule and each plant's storage capacity.
- A dry plant produces at its configured reduced rate. A groomed plant produces
    20% more crystals for one hour.
- Each plant has a maximum pending-yield capacity. Once that capacity is full,
    the plant stops producing until the player collects its crystals.
- Pending crystals remain attached to the plant until collected. Crystals that
    were already stored are not lost when the plant becomes dry, but a dead plant
    cannot be collected and any pending yield is forfeited.
- Costs and production should grow predictably enough that the next useful goal
    is visible to the player.

The player does not collect crystals remotely or through a global collection
button in the first version. Passing near a plant automatically starts the
collection effect. Collection range and the visual travel time of the particle
effect are balance and presentation values.

### Plant selling and movement

- A living plant can be sold for 80% of its original purchase price.
- Selling removes the plant and frees its slot immediately.
- A living plant can be moved freely to any available compatible slot without
    selling or repurchasing it.
- Dead plants cannot be moved or sold; they must be cleaned up first.
- Moving a plant preserves its level, condition, pending crystals, and active
    grooming boost.

## 7. Progression and Upgrades

Progression has three layers:

1. **Plant progression:** Upgrade an individual plant to increase its output or
     improve its care properties.
2. **Greenhouse progression:** Unlock new rooms, slots, themes, and plant pools.
3. **Global progression:** Purchase upgrades that affect the whole garden.

Items are greenhouse-level upgrades. An installed item gives a permanent bonus
to every plant in that greenhouse while it remains installed. Removing the item
also removes its bonus immediately. Items occupy a greenhouse slot, so the
player trades production capacity for a persistent multiplier or utility effect.
The first release should use a small number of simple items; adjacency rules
and complex item combinations are later expansion material.

Examples of future global upgrades include better tools, slower drying,
increased offline storage, faster walking, improved crystal collection, and
additional care efficiency. Global upgrades should support different play styles
without making plant choice irrelevant.

The long-term goal is to unlock every greenhouse and every plant. Plants are
not all available at the start: each greenhouse unlocks the next group of plant
types. The game should provide completion milestones and a final garden state,
even if there is no traditional story ending.

## 8. Offline Simulation and Saving

The game is fully offline. The save state is stored locally on the device and
must not require an account or network connection.

When the game is closed, the game stores a timestamp. On the next load it
calculates elapsed time and applies the relevant effects:

- Crystal production.
- Moisture and care timers for plants in the last visited greenhouse only.
- Growth or upgrade timers, if those are added.
- Condition changes and possible failure states.

Offline simulation must use the same rules as active simulation wherever
possible. Only the last visited greenhouse progresses while the game is closed;
all other greenhouses are paused. It is bounded by seven days. If the player has
been away for seven days or longer, every living plant in the progressing
greenhouse dies, pending yield is forfeited, and the greenhouse enters a terminal
neglected state. The state does not continue to change after that point: no
further production, drying, or additional death processing occurs until the
player returns and cleans up the dead plants.

This rule applies once per absence calculation. A player who returns before the
seven-day boundary can recover by watering plants and collecting their stored
crystals. The seven-day rule is intended to make long absences consequential
without allowing unlimited offline production.

The return screen should summarize production and important care events, for
example: crystals earned, plants that became dry, and plants that require
attention. The player should be able to understand what happened before
continuing.

Save requirements:

- Autosave after every state-changing action, including watering, grooming,
  collecting, planting, moving, selling, cleaning, upgrading, and greenhouse
  purchases. Also save on safe lifecycle events.
- Include a save schema version so future updates can migrate old saves.
- Handle invalid or partial saves by falling back to a valid default state.
- Keep the game playable if local storage is unavailable, with an in-memory
    session fallback where possible.

## 9. Player Movement and Camera

The main scene is an isometric greenhouse rendered by Chicken Fart Engine's
canvas and camera modules.

- The player can walk by clicking or tapping a valid floor position.
- The engine owns the canvas transform, floor-tile transform, world bounds, and
    camera view limits defined by the loaded level.
- The game may add camera follow and target-focus behavior through the engine's
    canvas API, but it must not duplicate camera state in the gameplay rules.
- Collision shapes and static greenhouse obstacles use Chicken Fart Engine's
    supported collision resources.
- Camera movement must remain usable on both mouse and touch screens.
- The player and plants should have readable selection and interaction states.

Movement is primarily an interaction method. It should not make routine care
slow or frustrating; direct selection or a future quick-action shortcut may be
needed for frequently repeated tasks.

## 10. Interface and Input

Chicken Fart Engine is responsible for the canvas, world rendering, entity
updates, collisions, level loading, and low-level keyboard/mouse input. The game
project is responsible for the DOM interface and all gameplay actions.

Planned interface areas:

- Crystal balance and global status HUD.
- Plant inspection panel.
- Care action controls.
- Plant shop.
- Plant upgrade menu.
- Greenhouse selection and unlock screen.
- Global upgrade tree.
- Offline return summary.
- Settings, save/reset controls, and accessibility options.

The interface should support mouse, touch, and keyboard where practical. Every
important state should have a visual signal and, where possible, a non-color
signal such as an icon, text label, animation, or sound option. UI overlays may
use ordinary HTML and CSS; the game does not require a UI framework or custom
element system for the first version.

## 11. Technical Direction

The game is a fresh web project built on Chicken Fart Engine rather than a
custom rendering or entity framework.

### Engine boundary

- Consume `@chickenfart/engine` as a package dependency. Until the engine has a
    published release, pin the dependency to a known repository commit or use a
    local `file:` dependency during development.
- Use the engine's ES module entry points, including `world`, `canvas`, `input`,
    `collision`, `floorTiles`, `entitiesFactory`, and `sound` where needed.
- Keep engine code in the engine package. Keep Alien Garden rules, content,
    entity scripts, UI, save data, and progression logic in this repository.
- Use `world.init()` to configure the canvas and asset paths, then use
    `world.loadLevel()` to load each greenhouse level.
- Represent greenhouse geometry and initial placements in Chicken Fart Engine
    level JSON. Represent reusable sprite dimensions, animations, anchors, and
    collision shapes in engine entity-resource JSON.
- Implement plant, player, crystal, and item behavior as project-owned entity
    scripts using the engine lifecycle hooks (`onStart`, `onUpdate`,
    `onCollision`, `onAnimationEvent`, and `onDraw`) where appropriate.
- Do not place balance rules in entity drawing code or engine callbacks. Entity
    scripts may translate simulation state into visuals, but the rules engine
    remains the owner of production, care, progression, and save behavior.

### Project structure and runtime

- Use a small Vite application with JavaScript ES modules, matching the engine's
    complete example project.
- Keep the runtime loop and entity lifecycle in Chicken Fart Engine; keep the
    offline simulator and persistent `GameState` as engine-independent modules
    so they can be tested without a browser canvas.
- Use ordinary HTML/CSS/JavaScript for HUDs, panels, shops, summaries, and
    settings. The first version does not require React, Svelte, Web Components,
    or Capacitor.
- Store gameplay content under the game's public asset tree in the formats the
    engine loads: levels, entity resources, floor-tile resources, sprites, and
    sounds. Store balance and progression data separately from render assets.
- The game must run without a network connection after its assets and engine
    dependency have been installed or bundled.

### Chicken Fart content contract

Chicken Fart Engine does not validate content JSON at runtime. Alien Garden must
validate its own balance, save, and progression data before using it, and should
fail with a readable error rather than silently starting with corrupted values.
Engine content should follow the schemas in the Chicken Fart Engine repository:

- Entity resources define sprite-sheet frame size, anchors, animation states,
    animation events, and optional collision geometry.
- Floor-tile resources define the source tile-sheet dimensions and tile size.
- Level data defines entities, floor tiles, world dimensions, transforms, and
    camera view limits. A matching level script may perform level-specific setup.

The engine's level/entity JSON describes where things are and how they render;
the game's balance configuration describes what those things do.

### Audio roadmap

The initial version is soundless. Audio will be added later, including feedback
for walking, watering, grooming, collection, plant death, purchases, and
greenhouse unlocks. Sound and haptics should remain optional settings when they
are introduced.

### Balance configuration

All gameplay parameters should be editable in one data file in the game project:
`src/game/data/gameplay-config.json`. The rules engine should read this data;
rendering code, entity resources, and UI code should not contain balance
constants.

The configuration should include values such as:

```json
{
    "offline": {
        "maxAwaySeconds": 604800,
        "terminalAbsenceSeconds": 604800
    },
    "care": {
        "wateringDurationSeconds": 5,
        "dryAfterSeconds": 10800,
        "dryProductionMultiplier": 0.5,
        "groomBoostMultiplier": 1.2,
        "groomBoostSeconds": 3600,
        "collectionRange": 1.25
    },
    "plants": {
        "star-fern": {
            "waterIntervalSeconds": 10800,
            "deathAfterDrySeconds": 172800,
            "pendingCapacity": 100
        }
    }
}
```

The example values are placeholders for tuning, not final balance. Plant
definitions should remain data-driven as well, including costs, level yields,
storage capacity, watering behavior, and greenhouse availability. The JSON
should be validated when loaded so a typo in a balance file cannot corrupt a
save or silently disable production.

## 12. Balance Data Contract

Every plant owns its own balance parameters in
`src/game/data/gameplay-config.json`. No plant should rely on a global default
for the values below:

- Purchase price and display information.
- Level list, production per second, and upgrade cost for each level.
- Watering interval before entering the dry state.
- Time spent dry before permanent death.
- Maximum pending-crystal capacity.
- Crystal color and greenhouse availability.

This makes balance tuning a data-editing task. The simulation should read the
plant record by ID and use the same record for production, condition changes,
inspection UI, and shop display.

## 13. Current Implementation Status

The previous implementation was deleted. The repository currently contains the
design document only; no gameplay behavior should be treated as implemented.

The first implementation must establish these foundations:

- A Vite application that imports a pinned `@chickenfart/engine` dependency.
- A boot path that calls `world.init()` and loads a starter greenhouse with
    `world.loadLevel()`.
- Valid starter level JSON, floor-tile resources, and entity-resource JSON that
    load successfully under Chicken Fart Engine.
- Project-owned entity scripts for the player and at least one plant.
- An engine-independent rules module with a small testable `GameState` and
    timestamp-based simulation boundary.
- A DOM HUD that can display the crystal balance and selected plant state.
- Local save/load with a versioned default save before adding progression depth.

The following gameplay systems remain unimplemented after the reset:

- Multiple greenhouse definitions and room switching.
- Player movement and pathfinding behavior built on engine input and collision.
- Camera follow, target focus, and interaction targeting.
- Planting and plant shop flows.
- Watering, grooming, cleaning, and condition states.
- Plant death and slot recovery.
- Offline return simulation and summary screen.
- Global upgrade tree.
- Items that occupy or modify greenhouse slots.
- Save schema migration and invalid-save recovery.
- Five-second watering interaction and care timers.
- Proximity collection and crystal-flight particles.

The first vertical slice is complete only when it proves the engine integration
and the core caretaker loop together: the player can enter one loaded
greenhouse, move to a plant, collect its pending crystals, water it, leave, and
return to a correct saved state.

## 14. Content and Balance Tables

These tables should become the easy-to-scan balance reference as content grows.
Exact values should eventually live in the corresponding data modules.

### Plants

| ID | Name | Role | Base cost | Production | Care trait | Max level |
| --- | --- | --- | ---: | ---: | --- | ---: |
| `star-fern` | Star-Fern | Hardy starter plant | 50 | 0.5/sec at level 1 | Standard watering | 10 |
| `crystal-cactus` | Crystal Cactus | Neglect-tolerant plant | 120 | 1.1/sec at level 1 | Longer dry tolerance | 10 |
| `glow-mushroom` | Glow Mushroom | High-output plant | 300 | 2.4/sec at level 1 | Shorter dry tolerance | 10 |

### Upgrades

| ID | Name | Effect | Cost curve | Status |
| --- | --- | --- | --- | --- |
| `plant-level` | Plant level | Increases that plant's crystal production | Implemented per plant | Implemented |
| `greenhouse-item-*` | Greenhouse item | Gives a permanent bonus to all plants in one greenhouse while installed | To be defined | Planned |
| `better-tools` | Better tools | Improves care actions | To be defined | Later |
| `slow-dry` | Moisture retention | Slows moisture loss | To be defined | Later |
| `offline-storage` | Offline storage | Not planned for the first version because the seven-day rule is fixed | To be defined | Later |

## 15. Decisions Needed

The following decisions are now established:

- Grooming gives a 20% production boost for one hour and refreshes rather than
    stacks.
- Plants can die permanently. Cleanup is required before their slots can be
    reused.
- Crystals are collected manually by walking near plants, with a crystal-flight
    particle effect.
- Plants stop producing when their pending-yield capacity is full.
- An absence of seven days or more kills all living plants and freezes the
    neglected greenhouse until cleanup begins.
- Greenhouses are purchased with crystals and permanently unlock the next plant
    group.
- Items occupy slots and give permanent greenhouse-wide bonuses only while
    installed.
- The long-term goal is to unlock every greenhouse and every plant.

The following decisions are now established:

- Watering takes five seconds and can happen at any time.
- Plants become dry after three hours without watering and produce 50% fewer
    crystals while dry.
- Plants die permanently after 48 hours in the dry state if they are not
    watered.
- Plants can be sold for 80% of their original purchase price or moved freely
    between available compatible slots.
- Passing within range automatically collects crystals without requiring the
    player to stop.
- The entire state autosaves after every state-changing action.
- Only the last visited greenhouse progresses while the game is closed.
- The initial version is soundless; audio and haptics are later additions.

The remaining decisions are:

1. Should there be one save slot, multiple gardens, or export/import save data?
2. Should the game include optional notifications for plants becoming dry or
     dead?
3. What story, visual event, or completion screen marks the final greenhouse
     unlock?

## 16. Scope Milestones

### Vertical slice

- One greenhouse.
- A playable alien and basic camera framing.
- Two plant types with placement and manual collection.
- Walking close to a plant triggers collection and a crystal-flight particle
    effect.
- Watering prevents death and grooming applies the one-hour production boost.
- Save/load and a simple offline return calculation.

### First playable release

- One complete greenhouse with several plant types and distinct care traits.
- Multiple slots and a plant shop.
- Watering, grooming, cleaning, permanent death, and slot recovery rules.
- Plant upgrades and greenhouse items with removable greenhouse-wide bonuses.
- A second greenhouse that can be purchased with crystals and unlocks new plants.
- Clear onboarding and return summary.
- Seven-day absence handling, including the terminal neglected state.

### Later expansion

- More greenhouse themes.
- Neighboring-plant interactions and complex item combinations.
- Deeper progression and specialization.
- Achievements, optional notifications, and additional accessibility features.

## 17. Change Log

| Date | Decision or change | Reason |
| --- | --- | --- |
| 2026-09-09 | Reset the implementation plan around the Chicken Fart Engine package and its level/entity content schemas. | The previous implementation was deleted and the new project must use the author's engine. |
| 2026-09-08 | Established this document as the game mechanics source of truth. | Keep design intent separate from implementation details. |
| 2026-09-08 | Defined manual collection, one-hour grooming boosts, permanent death, greenhouse purchases, and seven-day absence handling. | Turn the core caretaker loop into implementable rules. |
| 2026-09-08 | Defined per-plant balance records and the three-slot starter greenhouse interaction slice. | Keep plant tuning data-driven and establish the first playable scene. |