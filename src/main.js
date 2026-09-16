import * as world from '@chickenfart/engine/world';
import { loadGameState, resetGameState, saveGameState } from './game/state/gameState.js';
import { onSelectionChange, clearSelection, getSelectedItem } from './game/state/selectionState.js';
import { clearSelectables, unregisterSelectable } from './game/state/selectableRegistry.js';
import { initSelectionSystem } from './game/systems/selection.js';
import { initFloorNavigationSystem } from './game/systems/floorNavigation.js';
import { initPlacementSystem } from './game/systems/placement.js';
import { startPlacement } from './game/state/placementState.js';
import { plantCatalog, getBuyablePlantIds } from './game/data/plantCatalog.js';
import { drawPlantThumbnail } from './game/ui/plantThumbnail.js';
import { resolvePlantPosition, getMaxPlants, getPlantPurchaseCost } from './game/systems/greenhouseSlots.js';
import { applyOfflineProduction } from './game/systems/offlineProduction.js';
import { settleProduction, getPlantProductionRate } from './game/systems/production.js';
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
const plantPopupUpgradeElement = document.querySelector('#plant-popup-upgrade');
const plantPopupUpgradeThumbElement = document.querySelector('#plant-popup-upgrade-thumb');
const plantPopupUpgradeProductionElement = document.querySelector('#plant-popup-upgrade-production');
const plantPopupUpgradeButton = document.querySelector('#plant-popup-upgrade-button');
const plantPopupMoveButton = document.querySelector('#plant-popup-move');
const buyPopupElement = document.querySelector('#buy-popup');
const buyPopupCloseButton = document.querySelector('#buy-popup-close');
const buyPopupListElement = document.querySelector('#buy-popup-list');
const buyPotButton = document.querySelector('#buy-pot-button');
const starterGreenhouseId = gameplayConfig.starterGreenhouseId;
let gameState = loadGameState();
let selectedPlantEntity = null;
// Every currently-spawned plant entity, so a reset can remove them from the world too.
let plantEntities = [];

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
  const greenhouseState = gameState.greenhouses[starterGreenhouseId];
  const maxPlants = getMaxPlants(gameplayConfig, starterGreenhouseId);
  buyPotButton.hidden = !greenhouseState || greenhouseState.plants.length >= maxPlants;
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
    crystals: gameState.crystals + gameplayConfig.crystals.pickupValue,
    totalCollectedCrystals: gameState.totalCollectedCrystals + gameplayConfig.crystals.pickupValue
  };
  persistGameState();
}

function renderPlantPopup(item) {
  const plant = item && item.type === 'plant' ? item : null;
  plantPopupElement.hidden = !plant;
  selectedPlantEntity = plant ? plant.entity : null;
  if (!plant) return;

  // Re-read from gameState (not the stale selection snapshot) so post-upgrade values stay correct.
  const greenhouseState = gameState.greenhouses[starterGreenhouseId];
  const record = greenhouseState.plants.find((r) => r.slotId === plant.entity.slotId);
  const config = gameplayConfig.plants[plant.plantId];
  const levelConfig = config.levels[record.level - 1];

  plantPopupNameElement.textContent = config.name;
  plantPopupLevelElement.textContent = String(record.level);
  plantPopupProductionElement.textContent = `${levelConfig.productionPerSecond}/sec`;

  renderPlantUpgradeSection(plant.plantId, config, record, levelConfig);
}

function renderPlantUpgradeSection(plantId, config, record, levelConfig) {
  const nextLevelConfig = config.levels[record.level];

  if (!nextLevelConfig || !levelConfig.upgradeCost) {
    plantPopupUpgradeElement.classList.add('plant-popup-upgrade--maxed');
    plantPopupUpgradeThumbElement.hidden = true;
    plantPopupUpgradeProductionElement.textContent = 'Max level reached';
    plantPopupUpgradeButton.hidden = true;
    return;
  }

  plantPopupUpgradeElement.classList.remove('plant-popup-upgrade--maxed');
  plantPopupUpgradeThumbElement.hidden = false;
  drawPlantThumbnail(plantPopupUpgradeThumbElement, plantId, nextLevelConfig.level);
  plantPopupUpgradeProductionElement.textContent = `${nextLevelConfig.productionPerSecond}/sec`;

  plantPopupUpgradeButton.hidden = false;
  plantPopupUpgradeButton.disabled = gameState.crystals < levelConfig.upgradeCost;
  plantPopupUpgradeButton.textContent = `Upgrade to Lv.${nextLevelConfig.level} — ${levelConfig.upgradeCost} crystals`;
}

function renderBuyPopup() {
  buyPopupListElement.innerHTML = '';

  const ownedPlantsCount = gameState.greenhouses[starterGreenhouseId]?.plants.length ?? 0;

  for (const plantId of getBuyablePlantIds()) {
    const config = gameplayConfig.plants[plantId];
    const catalogEntry = plantCatalog[plantId];
    const cost = getPlantPurchaseCost(gameplayConfig, starterGreenhouseId, config, ownedPlantsCount);
    const affordable = gameState.crystals >= cost;

    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'buy-option';
    option.disabled = !affordable;
    option.addEventListener('click', () => buyPlant(plantId));

    const thumb = document.createElement('canvas');
    thumb.className = 'buy-option-thumb';
    thumb.width = 56;
    thumb.height = 102;
    drawPlantThumbnail(thumb, plantId, 1);

    const name = document.createElement('span');
    name.className = 'buy-option-name';
    name.textContent = config.name;

    const costElement = document.createElement('span');
    costElement.className = 'buy-option-cost';
    costElement.textContent = `${cost} crystals`;

    option.append(thumb, name, costElement);
    buyPopupListElement.appendChild(option);
  }
}

function findPlantRecord(slotId) {
  return gameState.greenhouses[starterGreenhouseId]?.plants.find((record) => record.slotId === slotId);
}

function makeProductionRateGetter(slotId) {
  return () => {
    const record = findPlantRecord(slotId);
    return record ? getPlantProductionRate(gameState, record, gameplayConfig) : 0;
  };
}

async function buyPlant(plantId) {
  const config = gameplayConfig.plants[plantId];
  const catalogEntry = plantCatalog[plantId];
  if (!config || !catalogEntry) return;

  const greenhouseState = gameState.greenhouses[starterGreenhouseId];
  const maxPlants = getMaxPlants(gameplayConfig, starterGreenhouseId);
  if (greenhouseState.plants.length >= maxPlants) return;

  const cost = getPlantPurchaseCost(gameplayConfig, starterGreenhouseId, config, greenhouseState.plants.length);
  if (gameState.crystals < cost) return;

  const player = world.getEntityByTag('player');
  const x = (player?.x ?? 0) + 30;
  const y = player?.y ?? 0;
  const slotId = `plant-${Date.now()}`;

  const plants = [
    ...greenhouseState.plants,
    { slotId, plantId, level: 1, plantedAt: Date.now(), wateredAt: Date.now(), alive: true, x, y }
  ];

  gameState = {
    ...gameState,
    crystals: gameState.crystals - cost,
    greenhouses: { ...gameState.greenhouses, [starterGreenhouseId]: { ...greenhouseState, plants } }
  };
  persistGameState();

  const plantEntity = await catalogEntry.create(x, y, 1, collectCrystal, makeProductionRateGetter(slotId));
  plantEntity.slotId = slotId;
  world.addEntity(plantEntity);
  plantEntities.push(plantEntity);

  buyPopupElement.hidden = true;
}

function openBuyPopup() {
  renderBuyPopup();
  buyPopupElement.hidden = false;
}

buyPotButton.addEventListener('click', () => {
  openBuyPopup();
});

function upgradePlant() {
  if (!selectedPlantEntity) return;

  const greenhouseState = gameState.greenhouses[starterGreenhouseId];
  const record = greenhouseState.plants.find((r) => r.slotId === selectedPlantEntity.slotId);
  if (!record || !record.plantId || !record.alive) return;

  const config = gameplayConfig.plants[record.plantId];
  const levelConfig = config.levels[record.level - 1];
  const nextLevelConfig = config.levels[record.level];
  if (!nextLevelConfig || !levelConfig.upgradeCost || gameState.crystals < levelConfig.upgradeCost) return;

  const plants = greenhouseState.plants.map((r) =>
    r.slotId === record.slotId ? { ...r, level: nextLevelConfig.level } : r
  );

  gameState = {
    ...gameState,
    crystals: gameState.crystals - levelConfig.upgradeCost,
    greenhouses: { ...gameState.greenhouses, [starterGreenhouseId]: { ...greenhouseState, plants } }
  };
  persistGameState();

  selectedPlantEntity.setLevel?.(nextLevelConfig.level);
  renderPlantPopup(getSelectedItem());
  statusElement.textContent = `${config.name} upgraded to level ${nextLevelConfig.level}.`;
}

plantPopupUpgradeButton.addEventListener('click', () => {
  upgradePlant();
});

function relocatePlant(slotId, x, y) {
  const greenhouseState = gameState.greenhouses[starterGreenhouseId];
  const plants = greenhouseState.plants.map((record) =>
    record.slotId === slotId ? { ...record, x, y } : record
  );

  gameState = {
    ...gameState,
    greenhouses: { ...gameState.greenhouses, [starterGreenhouseId]: { ...greenhouseState, plants } }
  };
  persistGameState();
  statusElement.textContent = 'Plant moved.';
}

plantPopupMoveButton.addEventListener('click', () => {
  if (!selectedPlantEntity) return;
  startPlacement(selectedPlantEntity, selectedPlantEntity.slotId);
  clearSelection();
  statusElement.textContent = 'Click somewhere on the greenhouse floor to place the plant (Esc to cancel).';
});

onSelectionChange((item) => {
  renderPlantPopup(item);
});

plantPopupCloseButton.addEventListener('click', () => {
  clearSelection();
});

buyPopupCloseButton.addEventListener('click', () => {
  buyPopupElement.hidden = true;
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

  const { gameState: caughtUpState, crystalsGained } = applyOfflineProduction(gameState, gameplayConfig);
  gameState = caughtUpState;
  gameState = saveGameState(gameState);
  renderHud();

  for (const record of gameState.greenhouses[starterGreenhouseId].plants) {
    if (!record.plantId) continue;
    const position = resolvePlantPosition(record);
    if (!position) continue;

    const entity = await plantCatalog[record.plantId].create(position.x, position.y, record.level, collectCrystal, makeProductionRateGetter(record.slotId));
    entity.slotId = record.slotId;
    world.addEntity(entity);
    plantEntities.push(entity);
  }

  renderBuyPotButton();
  initSelectionSystem();
  await initFloorNavigationSystem({ levelId: starterGreenhouseId, floorEntityName: 'Greenhouse1' });
  initPlacementSystem({
    onPlace: (target, x, y) => relocatePlant(target.slotId, x, y),
    onCancel: () => {
      statusElement.textContent = 'Move cancelled.';
    }
  });
  statusElement.textContent =
    crystalsGained > 0
      ? `Welcome back! Your garden produced ${Math.floor(crystalsGained)} crystals while you were away.`
      : 'Starter greenhouse loaded. The garden is ready for its first plant.';

  setInterval(settleActiveProduction, ACTIVE_PRODUCTION_INTERVAL_MS);
  setInterval(persistGameState, AUTOSAVE_INTERVAL_MS);
}

function removeAllPlantEntities() {
  for (const entity of plantEntities) {
    unregisterSelectable(entity);
    world.removeEntity(entity);
  }
  plantEntities = [];
}

resetSaveButton.addEventListener('click', () => {
  removeAllPlantEntities();
  clearSelection();
  buyPopupElement.hidden = true;
  gameState = resetGameState();
  persistGameState();
  statusElement.textContent = 'Local garden reset.';
});

boot().catch((error) => {
  console.error(error);
  statusElement.textContent = 'The greenhouse could not load. Check the browser console.';
});
