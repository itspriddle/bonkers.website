// Core battle state machine: turn order, trigger system, delegates to menu/resolver/renderer
import { DialogueBox } from '../engine/dialogue.js';
import { Transition } from '../engine/transition.js';
import { sfx } from '../engine/sfx.js';
import { BattleMenu } from './battle-menu.js';
import { BattleRenderer } from './battle-renderer.js';
import { clampPartyHP } from './action-resolver.js';
import { applyStatus, clearStatus, processStatusTick, shouldSkipTurn,
  getStatusPowerMod, getStatusAccuracyMod, checkConfusionSelfHit } from './status-effects.js';
import { createCombatant, PARTY_MEMBERS, ENEMY_DEFS } from '../data/combatants.js';
import { ABILITIES, ITEMS, ENEMY_MOVES } from '../data/actions.js';
import { ENCOUNTERS } from '../data/encounters.js';

const STATE = {
  INTRO: 'intro',
  PLAYER_MENU: 'player_menu',
  EXECUTE: 'execute',
  ENEMY_TURN: 'enemy_turn',
  STATUS_TICK: 'status_tick',
  DIALOGUE: 'dialogue',
  SCRIPTED_EVENT: 'scripted_event',
  VICTORY: 'victory',
  TRANSITION_OUT: 'transition_out',
};

export class BattleEngine {
  constructor(encounterKey, battleIndex) {
    this.encounterKey = encounterKey;
    this.battleIndex = battleIndex;
    const encounter = ENCOUNTERS[encounterKey];

    this.party = encounter.party.map(id => createCombatant(PARTY_MEMBERS[id], false));
    this.enemies = encounter.enemies.map(id => createCombatant(ENEMY_DEFS[id], true));
    this.encounter = encounter;
    this.state = STATE.INTRO;
    this.round = 0;
    this.turnOrder = [];
    this.turnIndex = 0;
    this.firedTriggers = new Set();
    this.cutenessUsed = false;
    this._cutenessTriggered = false;
    this.transitioning = false;

    // New state flags
    this.junieBegging = false;
    this.bellyTrap = false;
    this.ballPikachuCatch = false;

    this.itemCounts = {};
    for (const [key, item] of Object.entries(ITEMS)) {
      this.itemCounts[key] = item.maxCount;
    }

    this.dialogue = new DialogueBox();
    this.transition = new Transition();
    this.menu = new BattleMenu();
    this.renderer = new BattleRenderer();
    this._statusTickQueue = [];

    if (encounter.bgColors) this.renderer.setBgColors(encounter.bgColors);

    this.transition.fadeIn(1);
    this.dialogue.start(encounter.introDialogue, () => {
      this._startRound();
    });
  }

  // ─── Game loop ────────────────────────────────────────────────

  update(dt) {
    this.transition.update(dt);
    this.dialogue.update(dt);
    this.renderer.update(dt);
  }

  onInput(type, data) {
    if (this.transition.isActive()) return;
    if (this.state === STATE.PLAYER_MENU && this.menu.visible) {
      if (this.menu.handleTap(data.x, data.y)) return;
    }
    this.dialogue.tap();
  }

  render(ctx) {
    this.renderer.render(ctx, this.party, this.enemies);
    if (this.state === STATE.PLAYER_MENU && this.menu.visible) {
      this.menu.render(ctx);
    } else {
      this.dialogue.render(ctx);
    }
    this.transition.render(ctx);
  }

  // ─── Turn flow ────────────────────────────────────────────────

  _startRound() {
    if (this.transitioning) return;
    this.round++;
    const all = [...this.party.filter(p => p.alive), ...this.enemies.filter(e => e.alive)];
    this.turnOrder = all.sort((a, b) => b.speed - a.speed);
    this.turnIndex = 0;
    // Check immediate triggers at start of round (e.g. Josh KO in final boss round 1)
    this._checkTriggersAndContinue(() => this._nextTurn());
  }

  _nextTurn() {
    if (this.transitioning) return;

    // Early win check: if all enemies died mid-round, don't give remaining turns
    if (this.enemies.every(e => !e.alive)) {
      this._checkTriggersAndContinue(() => this._checkWin());
      return;
    }

    // Skip dead combatants
    while (this.turnIndex < this.turnOrder.length && !this.turnOrder[this.turnIndex].alive) {
      this.turnIndex++;
    }

    if (this.turnIndex >= this.turnOrder.length) {
      this._doStatusTicks();
      return;
    }

    const actor = this.turnOrder[this.turnIndex];

    // Status: asleep/sick skips turn
    const skipText = shouldSkipTurn(actor);
    if (skipText) {
      this.state = STATE.DIALOGUE;
      this.dialogue.start([{ speaker: '', text: skipText }], () => {
        this.turnIndex++;
        this._nextTurn();
      });
      return;
    }

    if (actor.isEnemy) {
      this._doEnemyTurn(actor);
    } else {
      this._doPlayerTurn(actor);
    }
  }

  _advanceTurn() {
    if (this.transitioning) return;
    this.turnIndex++;
    this._checkTriggersAndContinue(() => this._nextTurn());
  }

  // ─── Player turn ──────────────────────────────────────────────

  _doPlayerTurn(actor) {
    this.state = STATE.PLAYER_MENU;
    const battleState = {
      junieBegging: this.junieBegging,
      bellyTrap: this.bellyTrap,
    };
    this.menu.open(actor, this.party, this.enemies, this.itemCounts, battleState,
      (action, targets) => this._executePlayerAction(actor, action, targets));
  }

  _executePlayerAction(actor, action, targets) {
    this.state = STATE.EXECUTE;
    this.menu.close();

    // Decrement item count
    if (action.category === 'item') {
      for (const [key, item] of Object.entries(ITEMS)) {
        if (item === action) {
          this.itemCounts[key] = Math.max(0, (this.itemCounts[key] || 0) - 1);
          break;
        }
      }
    }

    // Defend
    if (action.special === 'defend') {
      const text = `${actor.name} braces for impact!`;
      this.dialogue.start([{ speaker: '', text }], () => this._advanceTurn());
      return;
    }

    // Junie Begging
    if (action.special === 'junieBegging') {
      this.junieBegging = true;
      const text = action.text || 'Junie used BEG FOR TREATS!';
      this.dialogue.start([{ speaker: '', text }], () => this._advanceTurn());
      return;
    }

    // Skip (sneak away)
    if (action.special === 'skip') {
      this.dialogue.start([{ speaker: '', text: action.text }], () => this._advanceTurn());
      return;
    }

    // Confusion self-hit check
    if (checkConfusionSelfHit(actor)) {
      actor.currentSprite = actor.attackSprite;
      const selfDmg = Math.max(1, Math.floor(10 * actor.power));
      actor.hp = Math.max(1, actor.hp - selfDmg);
      this.renderer.shake(actor.id, 0.3);
      this.renderer.flash(actor.id, 0.5);
      sfx.hit();
      this.dialogue.start([{ speaker: '', text: `${actor.name} is confused and hurt themselves!` }], () => {
        actor.currentSprite = actor.sprite;
        this._advanceTurn();
      });
      return;
    }

    // Belly Trap check: if attacking Thorny and bellyTrap is set
    if (this.bellyTrap && targets.length === 1 && targets[0].id === 'thorny' && action.power > 0) {
      this.bellyTrap = false;
      actor.currentSprite = actor.attackSprite;
      const trapDmg = 15;
      const chrys = this.party.find(p => p.id === 'chrys');
      if (chrys && chrys.alive) {
        chrys.hp = Math.max(1, chrys.hp - trapDmg);
        this.renderer.shake(chrys.id, 0.3);
        this.renderer.flash(chrys.id, 0.5);
      }
      sfx.hit();
      this.dialogue.start([{ speaker: '', text: 'It\'s a trap! Thorny slashes back!' }], () => {
        actor.currentSprite = actor.sprite;
        this._advanceTurn();
      });
      return;
    }

    // Build target list for 'all' target type
    if (action.target === 'all') {
      targets = [...this.party.filter(p => p.alive), ...this.enemies.filter(e => e.alive)];
    }

    // Get text: custom resolve or action text
    let text;
    let resolveResult = null;
    if (action.resolve && action.target !== 'all') {
      resolveResult = action.resolve(actor, targets[0], this._getState());
      text = resolveResult.text;

      // Ball Pikachu catch special
      if (resolveResult.special === 'catchJunie') {
        this.ballPikachuCatch = true;
        this.dialogue.start([{ speaker: '', text }], () => {
          this._checkTriggersAndContinue(() => this._advanceTurn());
        });
        return;
      }

      // Extra turn special (Red Bull)
      if (resolveResult.special === 'extraTurn') {
        if (resolveResult.sfx === 'heal') sfx.heal();
        this.dialogue.start([{ speaker: '', text }], () => {
          // Re-open menu for same actor instead of advancing
          this._doPlayerTurn(actor);
        });
        return;
      }

      // If resolve says no damage and no heal with no special — it's a "nothing" action
      if (!action.power && !resolveResult.applyDamage && !resolveResult.heal && !resolveResult.status && !resolveResult.overridePower) {
        if (resolveResult.emoji || action.emoji) {
          const pos = this._getTargetPos(targets[0]);
          if (pos) this.renderer.spawnEmoji(resolveResult.emoji || action.emoji, pos.x, pos.y);
        }
        this.dialogue.start([{ speaker: '', text }], () => this._advanceTurn());
        return;
      }

      // Override power from resolve (HEY CLAUDE vs JP)
      if (resolveResult.overridePower) {
        action = { ...action, power: resolveResult.overridePower };
      }
    } else if (action.target !== 'all') {
      text = action.text || `${actor.name} attacks!`;
    }

    // Spawn emoji particles
    if (action.emoji) {
      const targetForEmoji = targets[0] || actor;
      const pos = this._getTargetPos(targetForEmoji);
      if (pos) this.renderer.spawnEmoji(action.emoji, pos.x, pos.y);
    }

    actor.currentSprite = actor.attackSprite;

    // For 'all' target actions with resolve, process each target individually
    if (action.target === 'all' && action.resolve) {
      this._processAllTargets(actor, action, targets, 0, () => {
        actor.currentSprite = actor.sprite;
        setTimeout(() => this._advanceTurn(), 400);
      });
      return;
    }

    // If zoomies was used, reset begging flag
    if (action.requiresFlag === 'junieBegging') {
      this.junieBegging = false;
    }

    // Process each target
    this._processPlayerTargets(actor, action, targets, text, 0, resolveResult);
  }

  _processAllTargets(actor, action, targets, idx, callback) {
    if (idx >= targets.length) {
      callback();
      return;
    }

    const target = targets[idx];
    const result = action.resolve(actor, target, this._getState());

    if (!result || (!result.text && !result.heal && !result.status)) {
      this._processAllTargets(actor, action, targets, idx + 1, callback);
      return;
    }

    // Apply heal
    if (result.heal && target.alive) {
      target.hp = Math.min(target.maxHp, target.hp + result.heal);
      if (result.sfx === 'heal') sfx.heal();
    }

    // Apply status
    if (result.status) {
      applyStatus(target, result.status);
    }

    // Clear status
    if (result.clearStatus) {
      clearStatus(target);
    }

    // DWTS box special — Chrys takes damage
    if (result.special === 'dwtsBox') {
      const chrys = this.party.find(p => p.id === 'chrys' && p.alive);
      if (chrys) {
        chrys.hp = Math.max(1, chrys.hp - 10);
        this.renderer.shake(chrys.id, 0.3);
        this.renderer.flash(chrys.id, 0.5);
      }
    }

    this.dialogue.start([{ speaker: '', text: result.text }], () => {
      this._processAllTargets(actor, action, targets, idx + 1, callback);
    });
  }

  _processPlayerTargets(actor, action, targets, text, idx, resolveResult) {
    if (idx >= targets.length) {
      actor.currentSprite = actor.sprite;
      setTimeout(() => this._advanceTurn(), 400);
      return;
    }

    const target = targets[idx];
    const showText = idx === 0 ? text : null;

    const afterText = () => {
      // Check immunity
      if (target.immune && action.power > 0) {
        this.dialogue.start([{ speaker: '', text: `${target.name} is IMMUNE! It had no effect!` }], () => {
          this._processPlayerTargets(actor, action, targets, text, idx + 1, resolveResult);
        });
        return;
      }

      // Healing from resolve
      if (resolveResult && resolveResult.heal && target.alive) {
        target.hp = Math.min(target.maxHp, target.hp + resolveResult.heal);
        sfx.heal();
      }

      // Healing from action
      if (action.heal && target.alive) {
        target.hp = Math.min(target.maxHp, target.hp + action.heal);
        sfx.heal();
      }

      // Status from resolve
      if (resolveResult && resolveResult.status) {
        applyStatus(target, resolveResult.status);
      }

      // Damage
      if (action.power > 0) {
        const powerMod = 1 + getStatusPowerMod(actor);
        const accMod = getStatusAccuracyMod(actor);
        const effectiveAcc = Math.max(10, (action.accuracy || 100) * (1 + accMod));
        const missed = Math.random() * 100 > effectiveAcc;

        if (missed) {
          const missText = action.missText || `...but it missed!`;
          this.dialogue.start([{ speaker: '', text: missText }], () => {
            this._processPlayerTargets(actor, action, targets, text, idx + 1, resolveResult);
          });
          return;
        }

        const variance = 0.85 + Math.random() * 0.3;
        let damage = Math.max(1, Math.floor(action.power * actor.power * powerMod * variance));

        target.hp = Math.max(0, target.hp - damage);
        this.renderer.shake(target.id, 0.3);
        this.renderer.flash(target.id, 0.5);
        sfx.hit();

        if (target.hurtSprite) {
          target.currentSprite = target.hurtSprite;
          setTimeout(() => {
            target.currentSprite = target.defeatSprite && !target.alive ? target.defeatSprite : target.sprite;
          }, 500);
        }

        // Status effect on hit
        if (action.status) {
          const chance = action.statusChance || 1.0;
          if (Math.random() < chance) {
            applyStatus(target, action.status, action.statusDuration);
          }
        }

        // Check enemy death
        if (target.isEnemy && target.hp <= 0) {
          target.alive = false;
          if (target.defeatSprite) target.currentSprite = target.defeatSprite;
          sfx.enemyFaint();
        }
      }

      // Status on non-damage actions (from action definition)
      if (!action.power && action.status && !resolveResult) {
        const chance = action.statusChance || 1.0;
        if (Math.random() < chance) {
          applyStatus(target, action.status, action.statusDuration);
        }
      }

      this._processPlayerTargets(actor, action, targets, text, idx + 1, resolveResult);
    };

    if (showText) {
      if (action.power > 0) sfx.attack();
      this.dialogue.start([{ speaker: '', text: showText }], afterText);
    } else {
      afterText();
    }
  }

  // ─── Enemy turn ───────────────────────────────────────────────

  _doEnemyTurn(actor) {
    this.state = STATE.ENEMY_TURN;

    const moveKeys = actor.moves;
    if (!moveKeys || moveKeys.length === 0) {
      this._advanceTurn();
      return;
    }

    const moveKey = moveKeys[Math.floor(Math.random() * moveKeys.length)];
    const move = ENEMY_MOVES[moveKey];

    if (!move) {
      this._advanceTurn();
      return;
    }

    // Replace {name} placeholder in move text
    const t = (s) => s ? s.replace('{name}', actor.name) : s;

    // Special: belly trap
    if (move.special === 'bellyTrap') {
      this.bellyTrap = true;
      actor.currentSprite = actor.napSprite || actor.sprite;
      this.dialogue.start([{ speaker: '', text: t(move.text) }], () => {
        actor.currentSprite = actor.sprite;
        this._advanceTurn();
      });
      return;
    }

    // Special: hiss — puts party members to sleep, enrages Junie
    if (move.special === 'hiss') {
      actor.currentSprite = actor.attackSprite;
      const messages = [];
      for (const p of this.party) {
        if (!p.alive) continue;
        if (p.id === 'junie') {
          applyStatus(p, 'enraged');
          messages.push({ speaker: '', text: `${p.name} is ENRAGED by the hiss!` });
        } else {
          applyStatus(p, 'asleep', 1);
          messages.push({ speaker: '', text: `${p.name} flinches! Skips next turn!` });
        }
      }
      this.dialogue.start([
        { speaker: '', text: t(move.text) },
        ...messages,
      ], () => {
        actor.currentSprite = actor.sprite;
        this._advanceTurn();
      });
      return;
    }

    // Special: feather boa — per-target effects
    if (move.special === 'featherBoa') {
      actor.currentSprite = actor.attackSprite;
      const messages = [{ speaker: '', text: t(move.text) }];
      for (const p of this.party) {
        if (!p.alive) continue;
        if (p.id === 'chrys') {
          applyStatus(p, 'confused');
          messages.push({ speaker: '', text: 'Chrys is confused by the feather boa!' });
        } else if (p.id === 'josh') {
          applyStatus(p, 'enraged');
          messages.push({ speaker: '', text: 'Josh is ENRAGED by the feather boa!' });
        } else if (p.id === 'junie') {
          messages.push({ speaker: '', text: 'Junie is indifferent to the feather boa.' });
        }
      }
      this.dialogue.start(messages, () => {
        actor.currentSprite = actor.sprite;
        this._advanceTurn();
      });
      return;
    }

    // Special: charge
    if (move.special === 'charge') {
      actor.currentSprite = actor.attackSprite;
      this.dialogue.start([{ speaker: '', text: t(move.text) }], () => {
        actor.currentSprite = actor.sprite;
        this._advanceTurn();
      });
      return;
    }

    // Special: flee
    if (move.special === 'flee') {
      actor.currentSprite = actor.attackSprite;
      const fleeBlock = this.encounter.fleeText || `${actor.name} tried to flee! ...But there's nowhere to go!`;
      this.dialogue.start([
        { speaker: '', text: t(move.text) },
        { speaker: '', text: fleeBlock },
      ], () => {
        actor.currentSprite = actor.sprite;
        this._advanceTurn();
      });
      return;
    }

    // Special: skip
    if (move.special === 'skip') {
      this.dialogue.start([{ speaker: '', text: t(move.text) }], () => this._advanceTurn());
      return;
    }

    // Special: selfHeal
    if (move.special === 'selfHeal') {
      actor.hp = Math.min(actor.maxHp, actor.hp + (move.heal || 10));
      sfx.heal();
      this.dialogue.start([{ speaker: '', text: t(move.text) }], () => this._advanceTurn());
      return;
    }

    // Special: buff
    if (move.special === 'buff') {
      this.dialogue.start([{ speaker: '', text: t(move.text) }], () => this._advanceTurn());
      return;
    }

    // Normal attack
    const aliveParty = this.party.filter(p => p.alive);
    if (aliveParty.length === 0) {
      this._advanceTurn();
      return;
    }
    const target = aliveParty[Math.floor(Math.random() * aliveParty.length)];

    const missed = Math.random() * 100 > (move.accuracy || 100);
    const text = missed ? (t(move.missText) || `${t(move.text)} ...but it missed!`) : t(move.text);

    actor.currentSprite = actor.attackSprite;
    this.dialogue.start([{ speaker: '', text }], () => {
      if (!missed && move.power > 0) {
        sfx.hit();
        const variance = 0.85 + Math.random() * 0.3;
        let damage = Math.max(1, Math.floor(move.power * actor.power * variance));
        // Rigged: 50-70% damage reduction
        damage = Math.max(1, Math.floor(damage * (0.5 + Math.random() * 0.2)));
        // Clamp so party member can't drop below 1 HP (cuteness overload is safety net)
        damage = clampPartyHP(target, damage);
        target.hp = Math.max(1, target.hp - Math.max(0, damage));

        this.renderer.shake(target.id, 0.3);
        this.renderer.flash(target.id, 0.5);
        this._checkCutenessOverload();
      }

      // Restore to base sprite (which may have been mutated to rageSprite by trigger)
      actor.currentSprite = actor.sprite;
      setTimeout(() => {
        this._showCutenessIfNeeded(() => this._advanceTurn());
      }, 400);
    });
  }

  // ─── Status ticks ─────────────────────────────────────────────

  _doStatusTicks() {
    const all = [...this.party, ...this.enemies].filter(c => c.alive && c.status);
    this._statusTickQueue = all.slice();
    this._processNextStatusTick();
  }

  _processNextStatusTick() {
    if (this._statusTickQueue.length === 0) {
      this._checkTriggersAndContinue(() => this._checkWin());
      return;
    }

    const combatant = this._statusTickQueue.shift();
    const result = processStatusTick(combatant);

    if (!result || !result.text) {
      this._processNextStatusTick();
      return;
    }

    if (result.damage > 0) {
      const dmg = combatant.isEnemy ? result.damage : Math.min(result.damage, combatant.hp - 1);
      combatant.hp = Math.max(1, combatant.hp - dmg);
      this.renderer.flash(combatant.id, 0.3);
    }

    if (result.heal > 0) {
      combatant.hp = Math.min(combatant.maxHp, combatant.hp + result.heal);
    }

    this.state = STATE.STATUS_TICK;
    this.dialogue.start([{ speaker: '', text: result.text }], () => this._processNextStatusTick());
  }

  // ─── Trigger system ───────────────────────────────────────────

  _checkTriggersAndContinue(callback) {
    if (this.transitioning) return;

    const triggers = this.encounter.triggers || [];
    for (const trigger of triggers) {
      if (trigger.once && this.firedTriggers.has(trigger.id)) continue;
      if (trigger.condition(this._getState())) {
        this.firedTriggers.add(trigger.id);
        this._executeTrigger(trigger, callback);
        return;
      }
    }
    callback();
  }

  _executeTrigger(trigger, callback) {
    this.state = STATE.SCRIPTED_EVENT;
    const scripts = this.encounter.scripts[trigger.action];

    if (!scripts) {
      this._applyTriggerEffects(trigger.action, callback);
      return;
    }

    this.dialogue.start(scripts, () => {
      this._applyTriggerEffects(trigger.action, callback);
    });
  }

  _applyTriggerEffects(actionName, callback) {
    switch (actionName) {
      case 'catchJunieBall':
      case 'catchJunie':
      case 'catchJunieSafety': {
        const wildJunie = this.enemies.find(e => e.id === 'junieWild');
        if (wildJunie) {
          wildJunie.alive = false;
          wildJunie.hp = 0;
          wildJunie.currentSprite = wildJunie.defeatSprite || wildJunie.sprite;
        }
        sfx.victory();
        this._doVictoryTransition();
        return;
      }

      case 'joshArrives': {
        // Part 1: Junie runs away (sprite still visible during these lines)
        this.dialogue.start([
          { speaker: '', text: 'JP is too powerful!' },
          { speaker: '', text: 'Junie is scared! Junie runs away to hide!' },
        ], () => {
          // Remove Junie from party — sprite disappears
          const junieIdx = this.party.findIndex(p => p.id === 'junie');
          if (junieIdx !== -1) this.party.splice(junieIdx, 1);

          // Set Chrys to 1 HP
          const chrys = this.party.find(p => p.id === 'chrys');
          if (chrys) chrys.hp = 1;

          // Part 2: Josh arrives (Junie gone from screen)
          this.dialogue.start([
            { speaker: '', text: 'Chrys is barely standing...' },
            { speaker: '???', text: 'Hey! Leave them alone!' },
            { speaker: '', text: 'Josh arrives!' },
            { speaker: 'Josh', text: 'Sorry I\'m late. There was this fire and I had to rescue it from a baby.' },
            { speaker: '', text: 'Josh used ULTIMATE DAD MOVE!' },
            { speaker: '', text: 'It\'s super effective! JP was defeated!' },
          ], () => {
            // Defeat JP
            const jp = this.enemies.find(e => e.id === 'jp');
            if (jp) {
              jp.alive = false;
              jp.hp = 0;
              jp.immune = false;
              if (jp.defeatSprite) jp.currentSprite = jp.defeatSprite;
              sfx.enemyFaint();
            }
            sfx.victory();
            this._doVictoryTransition();
          });
        });
        return;
      }

      case 'joshKO': {
        const josh = this.party.find(p => p.id === 'josh');
        if (josh) {
          josh.hp = 0;
          josh.alive = false;
        }
        // Thorny powers up visually
        const thorny = this.enemies.find(e => e.id === 'thorny');
        if (thorny) {
          thorny.currentSprite = thorny.rageSprite || thorny.sprite;
          thorny.sprite = thorny.rageSprite || thorny.sprite;
        }
        callback();
        return;
      }

      case 'junieRejoin': {
        const evilJunie = this.enemies.find(e => e.id === 'evilJunie');
        if (evilJunie) {
          evilJunie.alive = false;
          evilJunie.hp = 0;
        }
        const junie = createCombatant(PARTY_MEMBERS.junie, false);
        this.party.push(junie);
        callback();
        return;
      }

      case 'thornyNap': {
        const thorny = this.enemies.find(e => e.id === 'thorny');
        if (thorny) {
          thorny.alive = false;
          thorny.hp = 0;
          if (thorny.napSprite) thorny.currentSprite = thorny.napSprite;
        }
        sfx.victory();
        this._doVictoryTransition();
        return;
      }
    }

    // Default: continue
    callback();
  }

  // ─── Win check ────────────────────────────────────────────────

  _checkWin() {
    if (this.transitioning) return;

    const allEnemiesDead = this.enemies.every(e => !e.alive);

    if (allEnemiesDead && !this.encounter.noNormalVictory) {
      sfx.victory();
      for (const p of this.party) {
        if (p.alive && p.cheerSprite) p.currentSprite = p.cheerSprite;
      }
      const victoryDialogue = this.encounter.victoryDialogue || [
        { speaker: '', text: 'Victory!' },
      ];
      this.state = STATE.VICTORY;
      this.dialogue.start(victoryDialogue, () => this._doVictoryTransition());
      return;
    }

    if (allEnemiesDead && this.encounter.noNormalVictory) {
      // Triggers should handle this. Force victory if stuck.
      if (!this.transitioning) {
        sfx.victory();
        this._doVictoryTransition();
      }
      return;
    }

    // Next round
    this._startRound();
  }

  _doVictoryTransition() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.state = STATE.TRANSITION_OUT;
    const nextBattleIndex = this.battleIndex + 1;

    if (this.encounterKey === 'finalBoss') {
      this.transition.fadeToScene('valentine');
    } else {
      this.transition.fadeToScene('overworld', { battleIndex: nextBattleIndex });
    }
  }

  // ─── Cuteness Overload ────────────────────────────────────────

  _checkCutenessOverload() {
    if (this.cutenessUsed) return;
    const junie = this.party.find(p => p.id === 'junie' && p.alive);
    if (!junie) return;
    const anyDangerous = this.party.some(p => p.alive && p.hp <= 1);
    if (!anyDangerous) return;

    this.cutenessUsed = true;
    this._cutenessTriggered = true;
    // Heal to full, clear all status
    for (const p of this.party) {
      if (p.alive) {
        p.hp = p.maxHp;
        clearStatus(p);
      }
    }
  }

  // Called after enemy turn completes to show cuteness dialogue before advancing
  _showCutenessIfNeeded(callback) {
    if (!this._cutenessTriggered) {
      callback();
      return;
    }
    this._cutenessTriggered = false;
    sfx.heal();
    this.state = STATE.SCRIPTED_EVENT;
    this.dialogue.start([
      { speaker: '', text: 'Junie used CUTENESS OVERLOAD!' },
      { speaker: '', text: 'Everyone is healed to full! All status cleared!' },
    ], callback);
  }

  // ─── Helpers ──────────────────────────────────────────────────

  _getState() {
    return {
      party: this.party,
      enemies: this.enemies,
      round: this.round,
      encounterKey: this.encounterKey,
      junieBegging: this.junieBegging,
      bellyTrap: this.bellyTrap,
      ballPikachuCatch: this.ballPikachuCatch,
      firedTriggers: this.firedTriggers,
    };
  }

  _getTargetPos(combatant) {
    if (combatant.isEnemy) {
      const idx = this.enemies.indexOf(combatant);
      const positions = this.renderer._getEnemyPositions(this.enemies.length);
      return positions[idx] || null;
    }
    const idx = this.party.indexOf(combatant);
    const positions = this.renderer._getPartyPositions(this.party.length);
    return positions[idx] || null;
  }
}
