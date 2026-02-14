// Canvas setup and rendering helpers
// Logical resolution: 360x640 (portrait mobile)

export const WIDTH = 360;
export const HEIGHT = 640;

let canvas, ctx;
let scale = 1;

export function initCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  resize();
  window.addEventListener('resize', resize);

  return { canvas, ctx };
}

function resize() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;

  // Scale to fit while maintaining aspect ratio
  scale = Math.min(windowW / WIDTH, windowH / HEIGHT);

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.style.width = Math.floor(WIDTH * scale) + 'px';
  canvas.style.height = Math.floor(HEIGHT * scale) + 'px';

  ctx.imageSmoothingEnabled = false;
}

export function getCanvas() { return canvas; }
export function getCtx() { return ctx; }
export function getScale() { return scale; }

export function clear(color = '#000') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// Draw sprite centered at x,y with given width/height
export function drawSprite(img, x, y, w, h) {
  if (!img || !img.complete) return;
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

// Draw sprite from top-left
export function drawSpriteAt(img, x, y, w, h) {
  if (!img || !img.complete) return;
  ctx.drawImage(img, x, y, w, h);
}

// Draw filled rect
export function fillRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Draw text with pixel font style
export function drawText(text, x, y, size = 16, color = '#fff', align = 'left') {
  ctx.font = `${size}px monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

// Fade overlay
export function drawFade(alpha, color = '#000') {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.globalAlpha = 1;
}
