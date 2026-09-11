import * as world from '@chickenfart/engine/world';
import { loadGameState, resetGameState, saveGameState } from './game/state/gameState.js';
import gameplayConfig from './game/data/gameplay-config.json';
import './style.css';

const statusElement = document.querySelector('#status');
const crystalBalanceElement = document.querySelector('#crystal-balance');
const resetSaveButton = document.querySelector('#reset-save');
const starterGreenhouseId = gameplayConfig.starterGreenhouseId;
let gameState = loadGameState();

function renderHud() {
  crystalBalanceElement.textContent = String(gameState.crystals);
}

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

  await world.loadLevel(starterGreenhouseId);
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
