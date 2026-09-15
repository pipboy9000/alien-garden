// Slot layout (where pots/plants sit) lives in gameplay-config.json since level
// JSON only describes background + collision now, not gameplay placements.

export function getSlots(gameplayConfig, greenhouseId) {
  return gameplayConfig.greenhouses?.[greenhouseId]?.slots ?? [];
}

export function getSlotPosition(gameplayConfig, greenhouseId, slotId) {
  return getSlots(gameplayConfig, greenhouseId).find((slot) => slot.id === slotId) ?? null;
}

// Purchased pots carry their own live x/y (they're freely placed/pushed), while
// starter pots only have a slotId resolved against gameplay-config.json's slots.
export function resolvePlantPosition(record, gameplayConfig, greenhouseId) {
  if (Number.isFinite(record.x) && Number.isFinite(record.y)) return { x: record.x, y: record.y };
  return getSlotPosition(gameplayConfig, greenhouseId, record.slotId);
}

export function getPotPurchaseConfig(gameplayConfig, greenhouseId) {
  return gameplayConfig.greenhouses?.[greenhouseId]?.potPurchase ?? null;
}

// Cost of the next pot given how many the player already owns (0-indexed into potCosts).
export function getNextPotCost(gameplayConfig, greenhouseId, ownedPotCount) {
  const potPurchase = getPotPurchaseConfig(gameplayConfig, greenhouseId);
  return potPurchase?.potCosts?.[ownedPotCount] ?? null;
}


// Populates a freshly-created (never-visited) greenhouse's plant slots with empty pots.
export function seedStarterSlots(greenhouseState, gameplayConfig, greenhouseId) {
  if (greenhouseState.plants.length > 0) return greenhouseState;

  const starterSlotIds = gameplayConfig.greenhouses?.[greenhouseId]?.starterSlotIds ?? [];
  const plants = starterSlotIds.map((slotId) => ({
    slotId,
    plantId: null,
    level: 1,
    plantedAt: null,
    wateredAt: null,
    alive: true
  }));

  return { ...greenhouseState, plants };
}
