// Slot layout (where pots/plants sit) lives in gameplay-config.json since level
// JSON only describes background + collision now, not gameplay placements.

export function getSlots(gameplayConfig, greenhouseId) {
  return gameplayConfig.greenhouses?.[greenhouseId]?.slots ?? [];
}

export function getSlotPosition(gameplayConfig, greenhouseId, slotId) {
  return getSlots(gameplayConfig, greenhouseId).find((slot) => slot.id === slotId) ?? null;
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
