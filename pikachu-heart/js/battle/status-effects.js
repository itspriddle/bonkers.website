// Status effect definitions and per-turn processing

export const STATUS = {
  SICK: 'sick',
  CONFUSED: 'confused',
  ENRAGED: 'enraged',
  ASLEEP: 'asleep',
};

const STATUS_DEFS = {
  [STATUS.SICK]: {
    label: 'SICK',
    icon: '\u{1F922}', // nauseated face
    color: '#7f7',
    defaultDuration: 2,
    powerMod: -0.2,     // -20% power
    skipTurn: true,
    tickDamage: 3,
    tickText: (name) => `${name} takes damage from being SICK!`,
    skipText: (name) => `${name} is too sick to move!`,
  },
  [STATUS.CONFUSED]: {
    label: 'CONFUSED',
    icon: '?',
    color: '#ff0',
    defaultDuration: 2,
    selfHitChance: 0.3,  // 30% chance to hit self
    selfHitText: (name) => `${name} is confused and hit themselves!`,
  },
  [STATUS.ENRAGED]: {
    label: 'ENRAGED',
    icon: '!',
    color: '#f44',
    defaultDuration: 3,
    powerMod: 0.5,       // +50% power
    accuracyMod: -0.3,   // -30% accuracy
  },
  [STATUS.ASLEEP]: {
    label: 'ASLEEP',
    icon: 'Z',
    color: '#88f',
    defaultDuration: 2,
    skipTurn: true,
    tickHeal: 5,
    tickText: (name) => `${name} is sleeping... HP restored a little!`,
    skipText: (name) => `${name} is fast asleep!`,
  },
};

export function getStatusDef(status) {
  return STATUS_DEFS[status] || null;
}

// Apply status to a combatant. Returns message text or null.
export function applyStatus(combatant, status, duration) {
  if (!status) return null;
  const def = STATUS_DEFS[status];
  if (!def) return null;

  combatant.status = status;
  combatant.statusTurns = duration || def.defaultDuration;
  return `${combatant.name} is now ${def.label}!`;
}

// Clear status from a combatant
export function clearStatus(combatant) {
  combatant.status = null;
  combatant.statusTurns = 0;
}

// Process status tick at end of round for one combatant.
// Returns { damage, heal, text, skipTurn } or null if no status.
export function processStatusTick(combatant) {
  if (!combatant.status || !combatant.alive) return null;
  const def = STATUS_DEFS[combatant.status];
  if (!def) return null;

  const result = { damage: 0, heal: 0, text: null, skipTurn: false };

  if (def.tickDamage) {
    result.damage = def.tickDamage;
    result.text = def.tickText(combatant.name);
  }

  if (def.tickHeal) {
    result.heal = def.tickHeal;
    result.text = def.tickText(combatant.name);
  }

  // Decrement duration
  combatant.statusTurns--;
  if (combatant.statusTurns <= 0) {
    clearStatus(combatant);
  }

  return result;
}

// Check if combatant should skip turn due to status
export function shouldSkipTurn(combatant) {
  if (!combatant.status || !combatant.alive) return null;
  const def = STATUS_DEFS[combatant.status];
  if (def && def.skipTurn) {
    return def.skipText(combatant.name);
  }
  return null;
}

// Check if confused combatant hits self instead
export function checkConfusionSelfHit(combatant) {
  if (combatant.status !== STATUS.CONFUSED) return false;
  const def = STATUS_DEFS[STATUS.CONFUSED];
  return Math.random() < def.selfHitChance;
}

// Get power modifier from status (-0.2 for sick, +0.5 for enraged, etc)
export function getStatusPowerMod(combatant) {
  if (!combatant.status) return 0;
  const def = STATUS_DEFS[combatant.status];
  return def ? (def.powerMod || 0) : 0;
}

// Get accuracy modifier from status
export function getStatusAccuracyMod(combatant) {
  if (!combatant.status) return 0;
  const def = STATUS_DEFS[combatant.status];
  return def ? (def.accuracyMod || 0) : 0;
}
