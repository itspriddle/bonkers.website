// Title screen scene
import { WIDTH, HEIGHT, fillRect, drawText, drawSprite } from '../engine/canvas.js';
import { getSprite } from '../engine/sprites.js';
import { sfx, resumeAudio } from '../engine/sfx.js';
import { Transition } from '../engine/transition.js';

const transition = new Transition();
let timer = 0;

export const titleScene = {
  enter() {
    timer = 0;
    transition.fadeIn(1.5);
  },

  update(dt) {
    timer += dt;
    transition.update(dt);
  },

  onInput(type) {
    if (transition.isActive()) return;
    resumeAudio();
    sfx.menuConfirm();
    transition.fadeToScene('intro');
  },

  render(ctx) {
    fillRect(0, 0, WIDTH, HEIGHT, '#0a0a0a');

    // Title card image — 1690x1610 original, scale to fit nicely
    // Aspect ratio ~1.05:1, so roughly square. Fit to ~300px wide
    const titleImg = getSprite('sprites/title-card@2x.png');
    const imgW = 300;
    const imgH = 300 * (1610 / 1690);
    drawSprite(titleImg, WIDTH / 2, 250, imgW, imgH);

    // Floating hearts around the card
    for (let i = 0; i < 6; i++) {
      const angle = (timer * 0.4 + i * Math.PI / 3);
      const radius = 160 + Math.sin(timer + i) * 10;
      const hx = WIDTH / 2 + Math.cos(angle) * radius;
      const hy = 250 + Math.sin(angle) * radius * 0.5;
      const scale = 1 + Math.sin(timer * 2 + i) * 0.3;
      drawPixelHeart(ctx, hx, hy, scale, '#ff4466');
    }

    // Flashing "Tap to Start"
    if (Math.floor(timer * 2) % 2 === 0) {
      drawText('Tap to Start', WIDTH / 2, 540, 16, '#fff', 'center');
    }

    transition.render(ctx);
  }
};

function drawPixelHeart(ctx, x, y, scale, color) {
  ctx.fillStyle = color;
  const s = scale;
  const rows = [
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
  ];
  const startX = x - rows[0].length * s / 2;
  const startY = y - rows.length * s / 2;
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c]) {
        ctx.fillRect(startX + c * s, startY + r * s, s, s);
      }
    }
  }
}
