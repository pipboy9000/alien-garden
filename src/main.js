import * as world from '@chickenfart/engine/world';
import { loadGameState, resetGameState, saveGameState } from './game/state/gameState.js';
import { onSelectionChange, clearSelection } from './game/state/selectionState.js';
import { clearSelectables, unregisterSelectable } from './game/state/selectableRegistry.js';
import { initSelectionSystem } from './game/systems/selection.js';
import { initFloorNavigationSystem } from './game/systems/floorNavigation.js';
import { plantCatalog, getBuyablePlantIds } from './game/data/plantCatalog.js';
import { drawPlantThumbnail } from './game/ui/plantThumbnail.js';
import { getSlotPosition, seedStarterSlots } from './game/systems/greenhouseSlots.js';
import { applyOfflineProduction } from './game/systems/offlineProduction.js';
import { settleProduction } from './game/systems/production.js';
import * as EmptyPot from './entities/EmptyPot.js';
import gameplayConfig from './game/data/gameplay-config.json';
import './style.css';

const AUTOSAVE_INTERVAL_MS = 30_000;

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

function persistGameState() {
  gameState = settleProduction(gameState, gameplayConfig).gameState;
  gameState = saveGameState(gameState);
  renderHud();
}

function collectCrystal() {
  gameState = {
    ...gameState,
    crystals: gameState.crystals + gameplayConfig.crystals.pickupValue
  };
  persistGameState();
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
    drawPlantThumbnail(thumb, plantId, 1);

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
  persistGameState();

  const config = gameplayConfig.plants[plantId];
  const catalogEntry = plantCatalog[plantId];
  if (!config || !catalogEntry || gameState.crystals < config.purchaseCost) return;

  const greenhouseState = gameState.greenhouses[starterGreenhouseId];
  const plants = greenhouseState.plants.map((record) =>
    record.slotId === pot.entity.slotId
      ? { ...record, plantId, level: 1, plantedAt: Date.now(), wateredAt: Date.now(), alive: true }
      : record
  );

  gameState = {
    ...gameState,
    crystals: gameState.crystals - config.purchaseCost,
    greenhouses: { ...gameState.greenhouses, [starterGreenhouseId]: { ...greenhouseState, plants } }
  };
  persistGameState();

  const { x, y, slotId } = pot.entity;
  unregisterSelectable(pot.entity);
  world.removeEntity(pot.entity);

  const plantEntity = await catalogEntry.create(x, y, 1, collectCrystal);
  plantEntity.slotId = slotId;
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

  gameState.greenhouses[starterGreenhouseId] ??= { unlocked: true, plants: [] };
  gameState.greenhouses[starterGreenhouseId] = seedStarterSlots(
    gameState.greenhouses[starterGreenhouseId],
    gameplayConfig,
    starterGreenhouseId
  );

  const { gameState: caughtUpState, crystalsGained } = applyOfflineProduction(gameState, gameplayConfig);
  gameState = caughtUpState;
  gameState = saveGameState(gameState);
  renderHud();

  for (const record of gameState.greenhouses[starterGreenhouseId].plants) {
    const slot = getSlotPosition(gameplayConfig, starterGreenhouseId, record.slotId);
    if (!slot) continue;

    const entity = record.plantId
      ? await plantCatalog[record.plantId].create(slot.x, slot.y, record.level, collectCrystal)
      : await EmptyPot.create(slot.x, slot.y);
    entity.slotId = record.slotId;
    world.addEntity(entity);
  }

  initSelectionSystem();
  await initFloorNavigationSystem({ levelId: starterGreenhouseId, floorEntityName: 'Greenhouse1' });
  statusElement.textContent =
    crystalsGained > 0
      ? `Welcome back! Your garden produced ${Math.floor(crystalsGained)} crystals while you were away.`
      : 'Starter greenhouse loaded. The garden is ready for its first plant.';

  setInterval(persistGameState, AUTOSAVE_INTERVAL_MS);
}

resetSaveButton.addEventListener('click', () => {
  gameState = resetGameState();
  persistGameState();
  statusElement.textContent = 'Local garden reset.';
});

boot().catch((error) => {
  console.error(error);
  statusElement.textContent = 'The greenhouse could not load. Check the browser console.';
});
