// Game loop and scene manager
import { clear, getCtx } from './canvas.js';
import { setInputHandler } from './input.js';

let currentScene = null;
let nextScene = null;
let lastTime = 0;

const scenes = {};

export function registerScene(name, scene) {
  scenes[name] = scene;
}

export function switchScene(name, data) {
  nextScene = { name, data };
}

export function getCurrentSceneName() {
  return currentScene ? currentScene._name : null;
}

function doSwitch() {
  if (!nextScene) return;
  const { name, data } = nextScene;
  nextScene = null;

  const scene = scenes[name];
  if (!scene) {
    console.error('Unknown scene:', name);
    return;
  }

  currentScene = scene;
  currentScene._name = name;
  setInputHandler((type, inputData) => {
    if (currentScene && currentScene.onInput) {
      currentScene.onInput(type, inputData);
    }
  });

  if (currentScene.enter) {
    currentScene.enter(data);
  }
}

export function startLoop() {
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
  lastTime = now;

  // Handle pending scene switch
  doSwitch();

  const ctx = getCtx();

  if (currentScene) {
    if (currentScene.update) currentScene.update(dt);
    clear();
    if (currentScene.render) currentScene.render(ctx);
  }

  requestAnimationFrame(loop);
}
