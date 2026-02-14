// Entry point: load assets, init game, start loop
import { initCanvas } from './engine/canvas.js';
import { initInput } from './engine/input.js';
import { preloadAll, getLoadProgress, isLoaded } from './engine/sprites.js';
import { registerScene, switchScene, startLoop } from './engine/game.js';
import { titleScene } from './scenes/title.js';
import { introScene } from './scenes/intro.js';
import { overworldScene } from './scenes/overworld.js';
import { battleScene } from './scenes/battle.js';
import { valentineScene } from './scenes/valentine.js';
import { creditsScene } from './scenes/credits.js';

// Init
initCanvas();
initInput();

// Register all scenes
registerScene('title', titleScene);
registerScene('intro', introScene);
registerScene('overworld', overworldScene);
registerScene('battle', battleScene);
registerScene('valentine', valentineScene);
registerScene('credits', creditsScene);

// Start loading assets
preloadAll();

// Loading screen
const loadingBar = document.getElementById('loading-bar');
const loadingScreen = document.getElementById('loading-screen');

function checkLoading() {
  const progress = getLoadProgress();
  loadingBar.style.width = (progress * 100) + '%';

  if (isLoaded()) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
    switchScene('title');
    startLoop();
  } else {
    requestAnimationFrame(checkLoading);
  }
}

checkLoading();
