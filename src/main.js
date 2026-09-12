import * as world from '@chickenfart/engine/world';
import { loadGameState, resetGameState, saveGameState } from './game/state/gameState.js';
import { onSelectionChange, clearSelection } from './game/state/selectionState.js';
import { clearPlants } from './game/state/plantRegistry.js';
import { initPlantSelectionSystem } from './game/systems/plantSelection.js';
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
const starterGreenhouseId = gameplayConfig.starterGreenhouseId;
let gameState = loadGameState();

function renderHud() {
  crystalBalanceElement.textContent = String(gameState.crystals);
}

function renderPlantPopup(plant) {
  plantPopupElement.hidden = !plant;
  if (!plant) return;

  plantPopupNameElement.textContent = plant.name;
  plantPopupLevelElement.textContent = String(plant.level);
  plantPopupProductionElement.textContent = `${plant.productionPerSecond}/sec`;
}

onSelectionChange(renderPlantPopup);

plantPopupCloseButton.addEventListener('click', () => {
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

  clearPlants();
  await world.loadLevel(starterGreenhouseId);
  initPlantSelectionSystem();
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
