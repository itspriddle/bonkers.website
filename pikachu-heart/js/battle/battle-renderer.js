// Unified battle renderer: backgrounds, sprites, HP bars, status icons, effects, emoji particles
import { WIDTH, HEIGHT, fillRect, drawSprite, drawText } from '../engine/canvas.js';
import { getSprite } from '../engine/sprites.js';
import { getStatusDef } from './status-effects.js';

const MENU_Y = HEIGHT - 160;

// Get display size for a combatant's current sprite (supports per-sprite sizes)
function _getSpriteSize(combatant, spritePath) {
  if (combatant.spriteSizes && combatant.spriteSizes[spritePath]) {
    return combatant.spriteSizes[spritePath];
  }
  return [combatant.spriteW, combatant.spriteH];
}

export class BattleRenderer {
  constructor() {
    this.shakeTimer = 0;
    this.shakeTarget = null;
    this.flashTimers = {};
    this.bgColors = { sky: '#87CEEB', ground: '#6b9e5a', platform: '#5a8e4a', menu: '#222' };
    this.particles = [];
  }

  setBgColors(colors) {
    this.bgColors = { ...this.bgColors, ...colors };
  }

  shake(targetId, duration = 0.3) {
    this.shakeTarget = targetId;
    this.shakeTimer = duration;
  }

  flash(targetId, duration = 0.5) {
    this.flashTimers[targetId] = duration;
  }

  spawnEmoji(emoji, x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        emoji,
        x: x + (Math.random() - 0.5) * 40,
        y: y - 20,
        vx: (Math.random() - 0.5) * 60,
        vy: -60 - Math.random() * 40,
        gravity: 80,
        life: 1.0,
        maxLife: 1.0,
        size: 16 + Math.random() * 8,
      });
    }
  }

  update(dt) {
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    for (const id of Object.keys(this.flashTimers)) {
      this.flashTimers[id] -= dt;
      if (this.flashTimers[id] <= 0) delete this.flashTimers[id];
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.vy += p.gravity * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, party, enemies) {
    this._drawBg(ctx, enemies.length);
    this._drawEnemies(ctx, enemies);
    this._drawParty(ctx, party);
    this._drawHPBars(ctx, party, enemies);
    this._drawParticles(ctx);
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.emoji, p.x, p.y);
      ctx.restore();
    }
  }

  _drawBg(ctx, enemyCount) {
    const { sky, ground, platform, menu } = this.bgColors;
    fillRect(0, 0, WIDTH, HEIGHT * 0.45, sky);
    fillRect(0, HEIGHT * 0.45, WIDTH, HEIGHT * 0.1, ground);

    // Enemy platforms
    const positions = this._getEnemyPositions(enemyCount);
    for (const pos of positions) {
      ctx.fillStyle = platform;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + 50, 60, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Party platform area
    ctx.fillStyle = platform;
    ctx.beginPath();
    ctx.ellipse(85, HEIGHT - 185, 60, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Menu bg
    fillRect(0, MENU_Y - 10, WIDTH, HEIGHT - MENU_Y + 10, menu);
  }

  _drawEnemies(ctx, enemies) {
    const positions = this._getEnemyPositions(enemies.length);

    enemies.forEach((enemy, i) => {
      if (!enemy.alive) return;
      const pos = positions[i];
      const shakeAmt = (this.shakeTarget === enemy.id && this.shakeTimer > 0)
        ? (Math.random() - 0.5) * 6 : 0;
      const flashing = this.flashTimers[enemy.id] > 0 &&
        Math.floor(this.flashTimers[enemy.id] * 10) % 2 === 0;

      ctx.save();
      if (shakeAmt) ctx.translate(shakeAmt, shakeAmt);
      if (flashing) ctx.globalAlpha = 0.3;

      const spritePath = enemy.currentSprite || enemy.sprite;
      const img = getSprite(spritePath);
      const [sw, sh] = _getSpriteSize(enemy, spritePath);
      drawSprite(img, pos.x, pos.y, sw, sh);
      ctx.restore();
    });
  }

  _drawParty(ctx, party) {
    const positions = this._getPartyPositions(party.length);

    party.forEach((member, i) => {
      if (!member.alive) return;
      const pos = positions[i];
      const shakeAmt = (this.shakeTarget === member.id && this.shakeTimer > 0)
        ? (Math.random() - 0.5) * 6 : 0;
      const flashing = this.flashTimers[member.id] > 0 &&
        Math.floor(this.flashTimers[member.id] * 10) % 2 === 0;

      ctx.save();
      if (shakeAmt) ctx.translate(shakeAmt, shakeAmt);
      if (flashing) ctx.globalAlpha = 0.3;

      const spritePath = member.currentSprite || member.sprite;
      const img = getSprite(spritePath);
      const [sw, sh] = _getSpriteSize(member, spritePath);
      drawSprite(img, pos.x, pos.y, sw, sh);
      ctx.restore();
    });
  }

  _drawHPBars(ctx, party, enemies) {
    // Enemy HP bars (top area)
    let barY = 25;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      this._drawHPBar(ctx, 10, barY, enemy.name, enemy.hp, enemy.maxHp, enemy.status);
      barY += 30;
    }

    // Party HP bars (bottom-right above menu)
    let partyBarY = MENU_Y - 20 - party.filter(p => p.alive).length * 28;
    for (const member of party) {
      if (!member.alive) continue;
      this._drawHPBar(ctx, WIDTH - 160, partyBarY, member.name, member.hp, member.maxHp, member.status);
      partyBarY += 28;
    }
  }

  _drawHPBar(ctx, x, y, name, hp, maxHp, status) {
    const barW = 120;
    const barH = 8;

    // Status icon
    let nameText = name;
    if (status) {
      const def = getStatusDef(status);
      if (def) {
        nameText = `${def.icon} ${name}`;
      }
    }

    drawText(nameText, x, y, 10, '#fff');
    fillRect(x, y + 13, barW, barH, '#333');

    const ratio = hp / maxHp;
    const color = ratio > 0.5 ? '#4caf50' : ratio > 0.2 ? '#ff9800' : '#f44336';
    fillRect(x, y + 13, barW * ratio, barH, color);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y + 13, barW, barH);

    // HP text
    drawText(`${hp}/${maxHp}`, x + barW + 4, y + 11, 8, '#aaa');
  }

  _getEnemyPositions(count) {
    if (count <= 0) return [];
    if (count === 1) {
      return [{ x: WIDTH / 2, y: 160 }];
    }
    // Spread enemies across top area
    const spacing = WIDTH / (count + 1);
    return Array.from({ length: count }, (_, i) => ({
      x: spacing * (i + 1),
      y: 155,
    }));
  }

  _getPartyPositions(count) {
    if (count <= 0) return [];
    if (count === 1) {
      return [{ x: 80, y: HEIGHT - 250 }];
    }
    // Stack party members bottom-left
    return Array.from({ length: count }, (_, i) => ({
      x: 60 + i * 55,
      y: HEIGHT - 250 + i * 15,
    }));
  }
}
