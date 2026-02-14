// Scene transitions: fade in/out
import { drawFade } from './canvas.js';
import { switchScene } from './game.js';
import { sfx } from './sfx.js';

export class Transition {
  constructor() {
    this.alpha = 0;
    this.state = 'none'; // none, fade-out, fade-in
    this.speed = 2; // alpha per second
    this.targetScene = null;
    this.targetData = null;
    this.onMidpoint = null;
  }

  fadeToScene(sceneName, data, speed = 2) {
    this.state = 'fade-out';
    this.alpha = 0;
    this.speed = speed;
    this.targetScene = sceneName;
    this.targetData = data;
    sfx.transition();
  }

  fadeIn(speed = 2) {
    this.state = 'fade-in';
    this.alpha = 1;
    this.speed = speed;
  }

  update(dt) {
    if (this.state === 'fade-out') {
      this.alpha += this.speed * dt;
      if (this.alpha >= 1) {
        this.alpha = 1;
        this.state = 'fade-in';
        if (this.targetScene) {
          switchScene(this.targetScene, this.targetData);
          this.targetScene = null;
          this.targetData = null;
        }
        if (this.onMidpoint) {
          this.onMidpoint();
          this.onMidpoint = null;
        }
      }
    } else if (this.state === 'fade-in') {
      this.alpha -= this.speed * dt;
      if (this.alpha <= 0) {
        this.alpha = 0;
        this.state = 'none';
      }
    }
  }

  render(ctx) {
    if (this.alpha > 0) {
      drawFade(this.alpha);
    }
  }

  isActive() {
    return this.state !== 'none';
  }
}

// Battle transition effect (screen flash + stripes)
export class BattleTransition {
  constructor() {
    this.active = false;
    this.timer = 0;
    this.duration = 1.0;
    this.onComplete = null;
  }

  start(onComplete) {
    this.active = true;
    this.timer = 0;
    this.onComplete = onComplete;
    sfx.battleStart();
  }

  update(dt) {
    if (!this.active) return;
    this.timer += dt;
    if (this.timer >= this.duration) {
      this.active = false;
      if (this.onComplete) this.onComplete();
    }
  }

  render(ctx) {
    if (!this.active) return;
    const progress = this.timer / this.duration;

    if (progress < 0.3) {
      // Flash white
      const flashAlpha = Math.sin(progress / 0.3 * Math.PI * 4) * 0.8;
      ctx.globalAlpha = Math.max(0, flashAlpha);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 360, 640);
      ctx.globalAlpha = 1;
    } else {
      // Closing blinds effect
      const blindProgress = (progress - 0.3) / 0.7;
      const stripeH = 640 / 8;
      ctx.fillStyle = '#000';
      for (let i = 0; i < 8; i++) {
        const w = 360 * blindProgress;
        const x = i % 2 === 0 ? 0 : 360 - w;
        ctx.fillRect(x, i * stripeH, w, stripeH);
      }
    }
  }
}
