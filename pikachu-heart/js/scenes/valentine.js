// Valentine ending scene
import { WIDTH, HEIGHT, fillRect, drawSprite, drawText } from '../engine/canvas.js';
import { getSprite } from '../engine/sprites.js';
import { DialogueBox } from '../engine/dialogue.js';
import { Transition } from '../engine/transition.js';
import { VALENTINE_DIALOGUE } from '../data/dialogue-text.js';

const dialogue = new DialogueBox();
const transition = new Transition();
let timer = 0;
let hearts = [];

export const valentineScene = {
  enter() {
    timer = 0;
    hearts = [];
    transition.fadeIn(2);

    setTimeout(() => {
      dialogue.start(VALENTINE_DIALOGUE, () => {
        // After dialogue, fade to credits
        setTimeout(() => {
          transition.fadeToScene('credits');
        }, 1500);
      });
    }, 1200);
  },

  update(dt) {
    timer += dt;
    transition.update(dt);
    dialogue.update(dt);

    // Spawn floating hearts
    if (Math.random() < 0.3 * dt * 60) {
      hearts.push({
        x: Math.random() * WIDTH,
        y: HEIGHT,
        speed: 20 + Math.random() * 30,
        size: 4 + Math.random() * 8,
        wobble: Math.random() * Math.PI * 2,
        alpha: 0.4 + Math.random() * 0.5,
      });
    }

    // Update hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.y -= h.speed * dt;
      h.wobble += dt * 2;
      if (h.y < -20) hearts.splice(i, 1);
    }
  },

  onInput(type) {
    if (transition.isActive()) return;
    dialogue.tap();
  },

  render(ctx) {
    // Warm gradient background
    fillRect(0, 0, WIDTH, HEIGHT, '#1a0a1e');

    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 73 + 17) % WIDTH;
      const sy = (i * 51 + 23) % (HEIGHT * 0.6);
      const twinkle = Math.sin(timer * 2 + i) * 0.3 + 0.7;
      ctx.globalAlpha = twinkle * 0.6;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Floating hearts
    for (const h of hearts) {
      ctx.globalAlpha = h.alpha;
      drawPixelHeart(ctx, h.x + Math.sin(h.wobble) * 10, h.y, h.size / 6, '#ff6688');
    }
    ctx.globalAlpha = 1;

    // Ground
    fillRect(0, HEIGHT * 0.65, WIDTH, HEIGHT * 0.35, '#2a1a2e');

    // Josh + Chrys sprites (same height, aspect-ratio-correct widths)
    const joshImg = getSprite('sprites/josh/idle.png');
    const chrysImg = getSprite('sprites/chrys/hearts.png');
    drawSprite(joshImg, WIDTH * 0.35, HEIGHT * 0.45, 102, 170);
    drawSprite(chrysImg, WIDTH * 0.65, HEIGHT * 0.45, 126, 170);

    dialogue.render(ctx);
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
