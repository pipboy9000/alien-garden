import * as world from '@chickenfart/engine/world';
import { loadGameState, resetGameState, saveGameState } from './game/state/gameState.js';
import { onSelectionChange, clearSelection } from './game/state/selectionState.js';
import { clearSelectables, unregisterSelectable } from './game/state/selectableRegistry.js';
import { initSelectionSystem } from './game/systems/selection.js';
import { initFloorNavigationSystem } from './game/systems/floorNavigation.js';
import { plantCatalog, getBuyablePlantIds } from './game/data/plantCatalog.js';
import { drawPlantThumbnail } from './game/ui/plantThumbnail.js';
import gameplayConfig from './game/data/gameplay-config.json';
import './style.css';

const statusElement = document.querySelector('#status');
const crystalBalanceElement = document.querySelector('#crystal-balance');
const resetSaveButton = document.querySelector('#reset-save');
const plantPopupElement = document.querySelector('#plant-popup');
const plantPopupCloseButton = document.querySelector('#plant-popup-close');
const plantPopupNameElement = document.querySelector('#plant-popup-name');
const plantPopupLevelElement = document.querySelector('#plant-popup-level');
const plantPopupProductionElement = document.querySelector('#plant-popup-production');
const buyPopupElement = document.querySelector('#buy-popup');
const buyPopupCloseButton = document.querySelector('#buy-popup-close');
const buyPopupListElement = document.querySelector('#buy-popup-list');
const starterGreenhouseId = gameplayConfig.starterGreenhouseId;
let gameState = loadGameState();

function renderHud() {
  crystalBalanceElement.textContent = String(gameState.crystals);
}

function renderPlantPopup(item) {
  const plant = item && item.type === 'plant' ? item : null;
  plantPopupElement.hidden = !plant;
  if (!plant) return;

  plantPopupNameElement.textContent = plant.name;
  plantPopupLevelElement.textContent = String(plant.level);
  plantPopupProductionElement.textContent = `${plant.productionPerSecond}/sec`;
}

function renderBuyPopup(item) {
  const pot = item && item.type === 'empty-pot' ? item : null;
  buyPopupElement.hidden = !pot;
  buyPopupListElement.innerHTML = '';
  if (!pot) return;

  for (const plantId of getBuyablePlantIds()) {
    const config = gameplayConfig.plants[plantId];
    const catalogEntry = plantCatalog[plantId];
    const affordable = gameState.crystals >= config.purchaseCost;

    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'buy-option';
    option.disabled = !affordable;
    option.addEventListener('click', () => buyPlant(pot, plantId));

    const thumb = document.createElement('canvas');
    thumb.className = 'buy-option-thumb';
    thumb.width = 56;
    thumb.height = 102;
    drawPlantThumbnail(thumb, catalogEntry.resourceName);

    const name = document.createElement('span');
    name.className = 'buy-option-name';
    name.textContent = config.name;

    const cost = document.createElement('span');
    cost.className = 'buy-option-cost';
    cost.textContent = `${config.purchaseCost} crystals`;

    option.append(thumb, name, cost);
    buyPopupListElement.appendChild(option);
  }
}

async function buyPlant(pot, plantId) {
  const config = gameplayConfig.plants[plantId];
  const catalogEntry = plantCatalog[plantId];
  if (!config || !catalogEntry || gameState.crystals < config.purchaseCost) return;

  gameState = { ...gameState, crystals: gameState.crystals - config.purchaseCost };
  saveGameState(gameState);
  renderHud();

  const { x, y } = pot.entity;
  unregisterSelectable(pot.entity);
  world.removeEntity(pot.entity);

  const plantEntity = await catalogEntry.create(x, y);
  world.addEntity(plantEntity);

  clearSelection();
}

onSelectionChange((item) => {
  renderPlantPopup(item);
  renderBuyPopup(item);
});

plantPopupCloseButton.addEventListener('click', () => {
  clearSelection();
});

buyPopupCloseButton.addEventListener('click', () => {
  clearSelection();
});


async function boot() {
  renderHud();

  await world.init({
    canvas: 'canvas',
    pixelation: 1,
    paths: {
      levels: 'levels/',
      levelScripts: 'levels/',
      entityScripts: 'src/entities/',
      entityResources: 'src/entities/resources/',
      floorTiles: 'src/floorTiles/'
    }
  });

  clearSelectables();
  await world.loadLevel(starterGreenhouseId);
  initSelectionSystem();
  await initFloorNavigationSystem({ levelId: starterGreenhouseId, floorEntityName: 'Greenhouse1' });
  statusElement.textContent = 'Starter greenhouse loaded. The garden is ready for its first plant.';
}

resetSaveButton.addEventListener('click', () => {
  gameState = resetGameState();
  saveGameState(gameState);
  renderHud();
  statusElement.textContent = 'Local garden reset.';
});

boot().catch((error) => {
  console.error(error);
  statusElement.textContent = 'The greenhouse could not load. Check the browser console.';
});
