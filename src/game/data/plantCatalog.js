import * as Cactus from '../../entities/Cactus.js';

// Maps a plantId (gameplay-config.json key) to its entity factory + spritesheet resource.
// Only plants with a working entity script belong here; gameplay-config.json may list
// plants that aren't implemented yet.
export const plantCatalog = {
  'crystal-cactus': {
    resourceName: 'Cactus',
    create: Cactus.create
  }
};

export function getBuyablePlantIds() {
  return Object.keys(plantCatalog);
}
