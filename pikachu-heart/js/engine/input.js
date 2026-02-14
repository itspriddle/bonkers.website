// Touch/click input handler
import { getCanvas, getScale, WIDTH, HEIGHT } from './canvas.js';

let currentHandler = null;
let initialized = false;

export function initInput() {
  if (initialized) return;
  initialized = true;

  const canvas = getCanvas();

  canvas.addEventListener('pointerdown', handlePointer);
  // Prevent context menu on long press
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function handlePointer(e) {
  e.preventDefault();
  const canvas = getCanvas();
  const scale = getScale();
  const rect = canvas.getBoundingClientRect();

  // Convert to logical coordinates
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  if (currentHandler) {
    currentHandler('tap', { x, y });
  }
}

export function setInputHandler(handler) {
  currentHandler = handler;
}
