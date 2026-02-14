// Overworld walking scene between battles
import { WIDTH, HEIGHT, fillRect, drawSprite, drawSpriteAt } from '../engine/canvas.js';
import { getSprite } from '../engine/sprites.js';
import { BattleTransition } from '../engine/transition.js';
import { Transition } from '../engine/transition.js';
import { switchScene } from '../engine/game.js';

const WALK_DURATION = 3.0; // seconds before battle transition
const GROUND_Y = HEIGHT * 0.7;

let timer = 0;
let walkFrame = 0;
let walkTimer = 0;
let bgOffset = 0;
let battleIndex = 0;
const battleTransition = new BattleTransition();
const fadeTransition = new Transition();
let transitionStarted = false;

// Scene flow: 6 encounters, all go through unified battle scene
const BATTLE_SEQUENCE = [
  { scene: 'battle', data: {} },  // 0: Catch Junie
  { scene: 'battle', data: {} },  // 1: Rock Pikachu
  { scene: 'battle', data: {} },  // 2: Fire Pikachu
  { scene: 'battle', data: {} },  // 3: Lightning Pikachu
  { scene: 'battle', data: {} },  // 4: JP
  { scene: 'battle', data: {} },  // 5: Final Boss
];

export const overworldScene = {
  enter(data) {
    timer = 0;
    walkFrame = 0;
    walkTimer = 0;
    bgOffset = 0;
    transitionStarted = false;
    battleIndex = (data && data.battleIndex !== undefined) ? data.battleIndex : 0;
    fadeTransition.fadeIn(1.5);
  },

  update(dt) {
    fadeTransition.update(dt);
    timer += dt;

    // Walk animation
    walkTimer += dt;
    if (walkTimer > 0.25) {
      walkTimer = 0;
      walkFrame = walkFrame === 0 ? 1 : 0;
    }

    // Scroll background
    bgOffset += 60 * dt;

    // Battle transition after walk duration
    if (timer >= WALK_DURATION && !transitionStarted) {
      transitionStarted = true;
      const target = BATTLE_SEQUENCE[battleIndex] || BATTLE_SEQUENCE[0];
      battleTransition.start(() => {
        switchScene(target.scene, { ...target.data, battleIndex });
      });
    }

    battleTransition.update(dt);
  },

  onInput() {
    // No input during walk
  },

  render(ctx) {
    // Sky gradient
    fillRect(0, 0, WIDTH, GROUND_Y, '#87CEEB');

    // Clouds
    drawCloud(ctx, (200 - bgOffset * 0.2) % (WIDTH + 80) - 40, 80);
    drawCloud(ctx, (400 - bgOffset * 0.15) % (WIDTH + 80) - 40, 120);

    // Ground
    fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, '#4a7c3f');

    // Path
    fillRect(0, GROUND_Y, WIDTH, 8, '#6b5e3f');

    // Grass tufts (scrolling)
    ctx.fillStyle = '#3a6c2f';
    for (let i = 0; i < 20; i++) {
      const gx = ((i * 50 - bgOffset * 0.5) % (WIDTH + 50)) - 25;
      ctx.fillRect(gx, GROUND_Y + 20 + (i % 3) * 30, 6, 4);
      ctx.fillRect(gx + 3, GROUND_Y + 17 + (i % 3) * 30, 6, 4);
    }

    // Trees in background (scrolling slower)
    for (let i = 0; i < 5; i++) {
      const tx = ((i * 120 - bgOffset * 0.3) % (WIDTH + 100)) - 50;
      drawTree(ctx, tx, GROUND_Y - 40);
    }

    // Chrys walking (alternate walk1 and walk2 for proper walk cycle)
    const chrysFrame = walkFrame === 0 ? 'walk1' : 'walk2';
    const chrysImg = getSprite(`sprites/chrys/${chrysFrame}.png`);
    drawSprite(chrysImg, WIDTH * 0.35, GROUND_Y - 55, 74, 120);

    // Companion: Junie floats behind Chrys (napping) after encounter 1
    if (battleIndex >= 1 && battleIndex < 5) {
      const junieImg = getSprite('sprites/zelda/nap.png');
      const bobY = Math.sin(timer * 2.5) * 4;
      drawSprite(junieImg, WIDTH * 0.35 - 45, GROUND_Y - 50 + bobY, 58, 60);
    }

    battleTransition.render(ctx);
    fadeTransition.render(ctx);
  }
};

function drawCloud(ctx, x, y) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.arc(x + 18, y - 5, 20, 0, Math.PI * 2);
  ctx.arc(x + 38, y, 15, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(ctx, x, y) {
  // Trunk
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(x + 10, y, 8, 25);
  // Leaves
  ctx.fillStyle = '#2d5a1e';
  ctx.beginPath();
  ctx.arc(x + 14, y - 8, 18, 0, Math.PI * 2);
  ctx.fill();
}
