// Intro scene: Josh gives Chrys the ball Pikachu
import { WIDTH, HEIGHT, fillRect, drawSprite } from '../engine/canvas.js';
import { getSprite } from '../engine/sprites.js';
import { DialogueBox } from '../engine/dialogue.js';
import { Transition } from '../engine/transition.js';
import { INTRO_DIALOGUE } from '../data/dialogue-text.js';

let dialogue, transition;
let joshPose = 'idle';
let showBall = false;
let joshAlpha = 1;
let pageIndex = 0;

export const introScene = {
  enter() {
    joshPose = 'idle';
    showBall = false;
    joshAlpha = 1;
    pageIndex = 0;
    dialogue = new DialogueBox();
    transition = new Transition();
    transition.fadeIn(1.5);

    setTimeout(() => {
      dialogue.start(INTRO_DIALOGUE, () => {
        transition.fadeToScene('overworld', { battleIndex: 0 });
      });
    }, 800);
  },

  update(dt) {
    dialogue.update(dt);
    transition.update(dt);
    if (showBall && joshAlpha > 0) {
      joshAlpha = Math.max(0, joshAlpha - dt * 1.5);
    }
  },

  onInput(type) {
    if (transition.isActive()) return;
    if (!dialogue.active) return;

    const wasTyping = dialogue.isTyping();
    dialogue.tap();

    // Track page advances for pose/prop changes
    if (!wasTyping) {
      pageIndex++;
      if (pageIndex === 2) joshPose = 'giving';
      if (pageIndex === 3) showBall = true;
    }
  },

  render(ctx) {
    fillRect(0, 0, WIDTH, HEIGHT, '#1a1a2e');
    fillRect(0, HEIGHT * 0.65, WIDTH, HEIGHT * 0.35, '#2a2a3e');

    if (joshAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = joshAlpha;
      const joshImg = getSprite(`sprites/josh/${joshPose}.png`);
      drawSprite(joshImg, WIDTH / 2, HEIGHT * 0.35, 102, 170);
      ctx.restore();
    }

    if (showBall) {
      const ballImg = getSprite('sprites/ball/ball.png');
      drawSprite(ballImg, WIDTH / 2, HEIGHT * 0.55, 55, 66);
    }

    dialogue.render(ctx);
    transition.render(ctx);
  }
};
