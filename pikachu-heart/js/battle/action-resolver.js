// Resolves action effects: damage, healing, status, text
import {
  checkConfusionSelfHit,
  getStatusPowerMod,
  getStatusAccuracyMod,
  getStatusDef,
  STATUS,
} from './status-effects.js';

// Calculate raw damage with variance
function calcDamage(basePower, userPower, accuracy) {
  if (Math.random() * 100 > accuracy) return { damage: 0, missed: true };
  const variance = 0.85 + Math.random() * 0.3;
  const damage = Math.floor(basePower * userPower * variance);
  return { damage: Math.max(1, damage), missed: false };
}

// Resolve an action from user on target(s).
// action: from actions.js (has resolve() or flat stats)
// user: combatant performing the action
// targets: array of target combatants
// battleState: { party, enemies, round, encounterKey }
// Returns array of results: [{ target, damage, heal, status, statusTurns, text, sfx, special }]
export function resolveAction(action, user, targets, battleState) {
  // If action has custom resolve(), use it
  if (action.resolve) {
    return targets.map(target => {
      const result = action.resolve(user, target, battleState);
      return { target, ...result };
    });
  }

  // Default resolution for simple actions
  return targets.map(target => {
    const result = {
      target,
      damage: 0,
      heal: 0,
      status: null,
      statusTurns: 0,
      text: action.text || `${user.name} attacks!`,
      sfx: 'hit',
      special: null,
    };

    // Check confusion self-hit
    if (checkConfusionSelfHit(user)) {
      const selfDmg = Math.floor(action.power * 0.3);
      return {
        target: user,
        damage: selfDmg,
        heal: 0,
        status: null,
        statusTurns: 0,
        text: `${user.name} is confused and hurt themselves!`,
        sfx: 'hit',
        special: 'self_hit',
      };
    }

    if (action.power > 0) {
      const powerMod = 1 + getStatusPowerMod(user);
      const accMod = getStatusAccuracyMod(user);
      const effectiveAcc = Math.max(10, (action.accuracy || 100) * (1 + accMod));
      const { damage, missed } = calcDamage(action.power, user.power * powerMod, effectiveAcc);

      if (missed) {
        result.damage = 0;
        result.text = action.missText || `${result.text} ...but it missed!`;
        result.sfx = null;
        return result;
      }

      result.damage = damage;
    }

    if (action.heal) {
      result.heal = action.heal;
      result.sfx = 'heal';
    }

    if (action.status && result.damage > 0) {
      // Status only applies if the attack hit
      const chance = action.statusChance || 1.0;
      if (Math.random() < chance) {
        const def = getStatusDef(action.status);
        result.status = action.status;
        result.statusTurns = action.statusDuration || (def ? def.defaultDuration : 2);
      }
    } else if (action.status && !action.power) {
      // Pure status action (no damage required)
      const chance = action.statusChance || 1.0;
      if (Math.random() < chance) {
        const def = getStatusDef(action.status);
        result.status = action.status;
        result.statusTurns = action.statusDuration || (def ? def.defaultDuration : 2);
      }
    }

    if (action.special) {
      result.special = action.special;
    }

    return result;
  });
}

// Apply rigging: enemy damage is reduced, party members can't drop below 10 HP
// (except scripted KOs which bypass this)
export function applyRigging(result, isEnemyAttack) {
  if (isEnemyAttack && result.damage > 0) {
    // Reduce enemy damage by 50-70%
    const mult = 0.5 + Math.random() * 0.2;
    result.damage = Math.max(1, Math.floor(result.damage * mult));
  }
  return result;
}

// Ensure party member doesn't drop below min HP (cuteness overload is the safety net at 1 HP)
export function clampPartyHP(combatant, damage) {
  const minHP = 1;
  if (combatant.hp - damage < minHP) {
    return Math.max(0, combatant.hp - minHP);
  }
  return damage;
}
