import * as world from '@chickenfart/engine/world';
import { loadGameState, resetGameState, saveGameState } from './game/state/gameState.js';
import { onSelectionChange, clearSelection } from './game/state/selectionState.js';
import { clearSelectables, unregisterSelectable } from './game/state/selectableRegistry.js';
import { initSelectionSystem } from './game/systems/selection.js';
import { initFloorNavigationSystem } from './game/systems/floorNavigation.js';
import { plantCatalog, getBuyablePlantIds } from './game/data/plantCatalog.js';
import { drawPlantThumbnail } from './game/ui/plantThumbnail.js';
import {
  getSlotPosition,
  seedStarterSlots,
  resolvePlantPosition,
  getPotPurchaseConfig,
  getNextPotCost
} from './game/systems/greenhouseSlots.js';
import { applyOfflineProduction } from './game/systems/offlineProduction.js';
import { settleProduction, getPlantProductionRate } from './game/systems/production.js';
import * as EmptyPot from './entities/EmptyPot.js';
import gameplayConfig from './game/data/gameplay-config.json';
import './style.css';

const AUTOSAVE_INTERVAL_MS = 30_000;
const ACTIVE_PRODUCTION_INTERVAL_MS = 1_000;

const statusElement = document.querySelector('#status');
const crystalBalanceElement = document.querySelector('#crystal-balance');
const crystalRateElement = document.querySelector('#crystal-rate');
const resetSaveButton = document.querySelector('#reset-save');
const plantPopupElement = document.querySelector('#plant-popup');
const plantPopupCloseButton = document.querySelector('#plant-popup-close');
const plantPopupNameElement = document.querySelector('#plant-popup-name');
const plantPopupLevelElement = document.querySelector('#plant-popup-level');
const plantPopupProductionElement = document.querySelector('#plant-popup-production');
const buyPopupElement = document.querySelector('#buy-popup');
const buyPopupCloseButton = document.querySelector('#buy-popup-close');
const buyPopupListElement = document.querySelector('#buy-popup-list');
const buyPotButton = document.querySelector('#buy-pot-button');
const buyPotCostElement = document.querySelector('#buy-pot-cost');
const starterGreenhouseId = gameplayConfig.starterGreenhouseId;
let gameState = loadGameState();

function renderHud() {
  crystalBalanceElement.textContent = gameState.crystals.toFixed(2);

  const greenhouseState = gameState.greenhouses[gameState.lastVisitedGreenhouseId];
  const productionPerSecond = greenhouseState
    ? greenhouseState.plants.reduce(
        (total, record) => total + getPlantProductionRate(gameState, record, gameplayConfig),
        0
      )
    : 0;
  crystalRateElement.textContent = `+${productionPerSecond.toFixed(2)}/s`;
}

function settleActiveProduction() {
  const result = settleProduction(gameState, gameplayConfig);
  gameState = result.gameState;
  renderHud();
}

function renderBuyPotButton() {
  const potPurchase = getPotPurchaseConfig(gameplayConfig, starterGreenhouseId);
  const greenhouseState = gameState.greenhouses[starterGreenhouseId];
  if (!potPurchase || !greenhouseState) {
    buyPotButton.hidden = true;
    return;
  }

  const ownedPotCount = greenhouseState.plants.length;
  if (ownedPotCount >= potPurchase.maxPots) {
    buyPotButton.hidden = true;
    return;
  }

  buyPotButton.hidden = false;
  const cost = getNextPotCost(gameplayConfig, starterGreenhouseId, ownedPotCount);
  buyPotCostElement.textContent = cost > 0 ? `${cost} crystals` : 'Free';
  buyPotButton.disabled = gameState.crystals < cost;
}

function persistGameState() {
  gameState = settleProduction(gameState, gameplayConfig).gameState;
  gameState = saveGameState(gameState);
  renderHud();
  renderBuyPotButton();
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

async function buyPot() {
  const potPurchase = getPotPurchaseConfig(gameplayConfig, starterGreenhouseId);
  const greenhouseState = gameState.greenhouses[starterGreenhouseId];
  if (!potPurchase || !greenhouseState) return;

  const ownedPotCount = greenhouseState.plants.length;
  if (ownedPotCount >= potPurchase.maxPots) return;

  const cost = getNextPotCost(gameplayConfig, starterGreenhouseId, ownedPotCount);
  if (cost == null || gameState.crystals < cost) return;

  const player = world.getEntityByTag('player');
  const x = (player?.x ?? 0) + 30;
  const y = player?.y ?? 0;
  const slotId = `pot-${Date.now()}`;

  const plants = [
    ...greenhouseState.plants,
    { slotId, plantId: null, level: 1, plantedAt: null, wateredAt: null, alive: true, x, y }
  ];

  gameState = {
    ...gameState,
    crystals: gameState.crystals - cost,
    greenhouses: { ...gameState.greenhouses, [starterGreenhouseId]: { ...greenhouseState, plants } }
  };
  persistGameState();

  const entity = await EmptyPot.create(x, y);
  entity.slotId = slotId;
  world.addEntity(entity);
}

buyPotButton.addEventListener('click', () => {
  buyPot().catch((error) => console.error(error));
});

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
    const position = resolvePlantPosition(record, gameplayConfig, starterGreenhouseId);
    if (!position) continue;

    const entity = record.plantId
      ? await plantCatalog[record.plantId].create(position.x, position.y, record.level, collectCrystal)
      : await EmptyPot.create(position.x, position.y);
    entity.slotId = record.slotId;
    world.addEntity(entity);
  }

  renderBuyPotButton();
  initSelectionSystem();
  await initFloorNavigationSystem({ levelId: starterGreenhouseId, floorEntityName: 'Greenhouse1' });
  statusElement.textContent =
    crystalsGained > 0
      ? `Welcome back! Your garden produced ${Math.floor(crystalsGained)} crystals while you were away.`
      : 'Starter greenhouse loaded. The garden is ready for its first plant.';

  setInterval(settleActiveProduction, ACTIVE_PRODUCTION_INTERVAL_MS);
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
