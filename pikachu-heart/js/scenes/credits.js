// Credits / HIGH SCORE screen
import { WIDTH, HEIGHT, fillRect, drawSprite, drawText } from '../engine/canvas.js';
import { getSprite } from '../engine/sprites.js';
import { Transition } from '../engine/transition.js';
import { sfx } from '../engine/sfx.js';

const transition = new Transition();
let timer = 0;
let scoreDisplay = 0;
let scoreTarget = 999999;
let scoreDone = false;
let showQuestion = false;

export const creditsScene = {
  enter() {
    timer = 0;
    scoreDisplay = 0;
    scoreDone = false;
    showQuestion = false;
    transition.fadeIn(2);
  },

  update(dt) {
    timer += dt;
    transition.update(dt);

    // Count up score
    if (!scoreDone) {
      scoreDisplay += 500000 * dt;
      if (scoreDisplay >= scoreTarget) {
        scoreDisplay = scoreTarget;
        scoreDone = true;
        setTimeout(() => { showQuestion = true; }, 800);
      }
    }
  },

  onInput() {
    if (transition.isActive()) return;
    if (showQuestion) {
      // Restart game
      sfx.menuConfirm();
      transition.fadeToScene('title');
    }
  },

  render(ctx) {
    fillRect(0, 0, WIDTH, HEIGHT, '#0a0a0a');

    // Arcade cabinet aesthetic
    fillRect(20, 30, WIDTH - 40, 3, '#333');
    fillRect(20, HEIGHT - 60, WIDTH - 40, 3, '#333');

    // HIGH SCORE
    drawText('HIGH SCORE', WIDTH / 2, 80, 22, '#ff4466', 'center');

    // Score number (counting up)
    const scoreStr = Math.floor(scoreDisplay).toString().padStart(6, '0');
    drawText(scoreStr, WIDTH / 2, 120, 36, '#fff', 'center');

    // Question text after score is done
    if (showQuestion) {
      drawText('...what does that mean?', WIDTH / 2, 200, 14, '#888', 'center');
      drawText('did I break it?', WIDTH / 2, 225, 14, '#888', 'center');

      // Chrys standing there looking unimpressed
      const chrysImg = getSprite('sprites/chrys/idle.png');
      drawSprite(chrysImg, WIDTH / 2, 380, 74, 120);

      // Tap to restart
      if (Math.floor(timer * 2) % 2 === 0) {
        drawText('Tap to play again', WIDTH / 2, 520, 14, '#666', 'center');
      }
    }

    // Footer
    drawText('Happy Valentine\'s Day 2026', WIDTH / 2, HEIGHT - 45, 10, '#444', 'center');

    transition.render(ctx);
  }
};
