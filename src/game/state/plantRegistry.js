// Live registry of selectable plant entities, rebuilt on every level load.
const plants = [];

export function registerPlant(entity, info) {
  plants.push({ entity, info });
}

export function unregisterPlant(entity) {
  const index = plants.findIndex((plant) => plant.entity === entity);
  if (index !== -1) plants.splice(index, 1);
}

export function getPlants() {
  return plants;
}

export function clearPlants() {
  plants.length = 0;
}
