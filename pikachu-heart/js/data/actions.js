// All abilities, items, ball pikachu, and enemy moves
// Each action: { name, power, accuracy, text, target, category,
//   status?, statusChance?, heal?, special?, resolve?(), emoji?, subActions?, owner? }
// target: 'enemy', 'ally', 'self', 'all_enemies', 'all_allies', 'all', 'any'
// category: 'ability', 'item', 'ball', 'defend'

import { STATUS } from '../battle/status-effects.js';

// ─── Chrys Abilities ──────────────────────────────────────────
export const ABILITIES = {
  // Chrys
  smooches: {
    name: '100 SMOOCHES',
    power: 20,
    accuracy: 100,
    target: 'enemy',
    category: 'ability',
    emoji: '\u{1F48B}',
    resolve(user, target) {
      const results = {
        thorny: {
          text: 'Chrys used 100 SMOOCHES on Thorny! He HATES it! Thorny is ENRAGED!',
          status: STATUS.ENRAGED, damage: true,
        },
        junieWild: {
          text: 'Chrys used 100 SMOOCHES on Junie! Junie tolerates it.',
          damage: false,
        },
        junie: {
          text: 'Chrys used 100 SMOOCHES on Junie! Junie tolerates it.',
          damage: false,
        },
        josh: {
          text: 'Chrys used 100 SMOOCHES on Josh! Massive healing!',
          heal: 50, damage: false,
        },
        jp: {
          text: 'Chrys used 100 SMOOCHES! JP: "How can she see me?!" No effect.',
          damage: false,
        },
      };
      const r = results[target.id] || { text: 'Chrys used 100 SMOOCHES!', damage: true };
      const wetTexts = [
        'That cheek is SOAKING WET!',
        'Absolutely drenched in kisses!',
        'So many smooches! Unrecoverable wetness!',
        'A torrential downpour of smooches!',
      ];
      const wetText = wetTexts[Math.floor(Math.random() * wetTexts.length)];
      return {
        damage: r.damage ? 0 : 0, // damage calculated by engine when r.damage is true
        heal: r.heal || 0,
        status: r.status || null,
        text: `${r.text} ${wetText}`,
        sfx: r.damage ? 'hit' : (r.heal ? 'heal' : null),
        applyDamage: r.damage !== false,
      };
    },
  },

  netflix: {
    name: 'NETFLIX & CHILL',
    power: 0,
    accuracy: 100,
    target: 'all',
    category: 'ability',
    emoji: '\u{1F4FA}',
    subActions: ['netflixFriends', 'netflixSeinfeld', 'netflixHR', 'netflixDWTS'],
  },

  netflixFriends: {
    name: 'Friends',
    power: 0,
    accuracy: 100,
    target: 'all',
    category: 'ability',
    emoji: '\u{1F4FA}',
    hidden: true,
    resolve(user, target) {
      const effects = {
        chrys: { text: 'Chrys is healed by the comfort of Friends!', heal: 25, sfx: 'heal' },
        junie: { text: 'Junie is soothed by Friends! Healed!', heal: 20, sfx: 'heal' },
        josh: { text: 'Josh watches Friends... he feels sick.', status: STATUS.SICK, sfx: null },
        thorny: { text: 'Thorny does not care about Friends.', sfx: null },
        jp: { text: 'JP does not understand human television.', sfx: null },
        evilJunie: { text: 'Evil Junie is soothed by Friends! Healed!', heal: 20, sfx: 'heal' },
      };
      const e = effects[target.id] || { text: `${target.name} watches Friends.`, sfx: null };
      return { damage: 0, heal: e.heal || 0, status: e.status || null, text: e.text, sfx: e.sfx };
    },
  },

  netflixSeinfeld: {
    name: 'Seinfeld',
    power: 0,
    accuracy: 100,
    target: 'all',
    category: 'ability',
    emoji: '\u{1F4FA}',
    hidden: true,
    resolve(user, target) {
      const effects = {
        chrys: { text: 'Chrys watches Seinfeld... she feels sick.', status: STATUS.SICK },
        josh: { text: 'Josh is healed by the comfort of Seinfeld!', heal: 25, sfx: 'heal' },
        thorny: { text: 'Thorny appreciates the Seinfeld bass riffs. Healed!', heal: 15, sfx: 'heal' },
        junie: { text: 'Junie does not care about Seinfeld.', sfx: null },
        jp: { text: 'JP recites Seinfeld quotes incorrectly.', sfx: null },
        evilJunie: { text: 'Evil Junie does not care about Seinfeld.', sfx: null },
      };
      const e = effects[target.id] || { text: `${target.name} watches Seinfeld.`, sfx: null };
      return { damage: 0, heal: e.heal || 0, status: e.status || null, text: e.text, sfx: e.sfx || null };
    },
  },

  netflixHR: {
    name: 'Heated Rivalry',
    power: 0,
    accuracy: 100,
    target: 'all',
    category: 'ability',
    emoji: '\u{1F4FA}',
    hidden: true,
    resolve(user, target) {
      const effects = {
        chrys: { text: 'Chrys is... hot and bothered. She loses her next turn!', status: STATUS.ASLEEP },
        josh: { text: 'Josh is unaffected by Heated Rivalry. He\'s reading Wikipedia.', sfx: null },
        junie: { text: 'Junie fell asleep watching Heated Rivalry!', status: STATUS.ASLEEP },
        thorny: { text: 'Thorny fell asleep watching Heated Rivalry!', status: STATUS.ASLEEP },
        jp: { text: 'JP does not understand romance.', sfx: null },
        evilJunie: { text: 'Evil Junie fell asleep watching Heated Rivalry!', status: STATUS.ASLEEP },
      };
      const e = effects[target.id] || { text: `${target.name} watches Heated Rivalry.`, sfx: null };
      return { damage: 0, heal: 0, status: e.status || null, text: e.text, sfx: e.sfx || null };
    },
  },

  netflixDWTS: {
    name: 'DWTS',
    power: 0,
    accuracy: 100,
    target: 'all',
    category: 'ability',
    emoji: '\u{1F483}',
    hidden: true,
    resolve(user, target) {
      const effects = {
        chrys: { text: 'Chrys gets up to dance! She loses her next turn!', status: STATUS.ASLEEP },
        josh: { text: 'Josh laughs at the dancing. No effect.', sfx: null },
        junie: { text: 'Junie uses the box while Chrys is distracted! Chrys takes damage!', special: 'dwtsBox' },
        thorny: { text: 'Thorny laughs at the dancing. ...can cats laugh?', sfx: null },
        jp: { text: 'JP attempts to dance. It is disturbing.', sfx: null },
        evilJunie: { text: 'Evil Junie uses the box! Gross!', special: 'dwtsBox' },
      };
      const e = effects[target.id] || { text: `${target.name} watches DWTS.`, sfx: null };
      return { damage: 0, heal: 0, status: e.status || null, text: e.text, sfx: e.sfx || null, special: e.special || null };
    },
  },

  audit: {
    name: 'AUDIT',
    power: 0,
    accuracy: 100,
    target: 'all_enemies',
    category: 'ability',
    emoji: '\u{1F4CB}',
    text: 'Chrys used AUDIT! She found MANY discrepancies. Everyone is confused!',
    status: STATUS.CONFUSED,
    statusChance: 1.0,
  },

  threatenChrys: {
    name: 'THREATEN',
    power: 10,
    accuracy: 100,
    target: 'enemy',
    category: 'ability',
    emoji: '\u{1F4E3}',
    resolve(user, target) {
      const effects = {
        thorny: {
          text: 'Chrys used THREATEN! Thorny is ENRAGED! (He was already mad.)',
          status: STATUS.ENRAGED, applyDamage: true,
        },
        josh: {
          text: 'Chrys used THREATEN on Josh! Josh laughs. No effect.',
          applyDamage: false,
        },
        jp: {
          text: 'Chrys used THREATEN! ...JP is unimpressed.',
          applyDamage: true,
        },
      };
      const e = effects[target.id] || {
        text: 'Chrys used THREATEN! ...it was not very intimidating.',
        applyDamage: true,
      };
      return {
        damage: 0, heal: 0,
        status: e.status || null,
        text: e.text, sfx: e.applyDamage ? 'hit' : null,
        applyDamage: e.applyDamage !== false,
      };
    },
  },

  // Josh
  heyClaude: {
    name: 'HEY CLAUDE',
    power: 0,
    accuracy: 100,
    target: 'enemy',
    category: 'ability',
    emoji: '\u{1F4BB}',
    resolve(user, target) {
      if (target.id === 'jp') {
        return {
          damage: 0, heal: 0, status: null,
          text: 'Josh used HEY CLAUDE! JP is a robot... IMMEDIATELY ASSIMILATED! Massive damage!',
          sfx: 'hit', applyDamage: true, overridePower: 60,
        };
      }
      return {
        damage: 0, heal: 0, status: null,
        text: 'Josh used HEY CLAUDE! ...he got distracted reading about trains. Lost his turn!',
        sfx: null, applyDamage: false,
      };
    },
  },

  threatenJosh: {
    name: 'THREATEN',
    power: 10,
    accuracy: 100,
    target: 'enemy',
    category: 'ability',
    emoji: '\u{1F4E3}',
    resolve(user, target) {
      const effects = {
        junieWild: {
          text: 'Josh used THREATEN! (Dad voice.) Junie hides! She skips her next turn!',
          status: STATUS.ASLEEP,
        },
        junie: {
          text: 'Josh used THREATEN! (Dad voice.) Junie hides! She skips her next turn!',
          status: STATUS.ASLEEP,
        },
        thorny: {
          text: 'Josh used THREATEN! Thorny is ENRAGED!',
          status: STATUS.ENRAGED,
        },
        chrys: {
          text: 'Josh used THREATEN! Chrys laughs. He\'s not scary.',
          applyDamage: false,
        },
        jp: {
          text: 'Josh used THREATEN! (Dad voice.) JP cowers! Skips next turn!',
          status: STATUS.ASLEEP,
        },
        evilJunie: {
          text: 'Josh used THREATEN! (Dad voice.) Evil Junie hides!',
          status: STATUS.ASLEEP,
        },
      };
      const e = effects[target.id] || { text: 'Josh used THREATEN!', applyDamage: true };
      return {
        damage: 0, heal: 0,
        status: e.status || null,
        text: e.text, sfx: 'hit',
        applyDamage: e.applyDamage !== false,
      };
    },
  },

  wikipediaStory: {
    name: 'WIKIPEDIA STORY',
    power: 0,
    accuracy: 100,
    target: 'all_enemies',
    category: 'ability',
    emoji: '\u{1F4D6}',
    resolve(user, target) {
      const topics = [
        'the history of the Slinky',
        'the mating habits of the horseshoe crab',
        'the 1904 Olympic marathon',
        'the etymology of "ketchup"',
        'why manhole covers are round',
        'the Great Emu War of 1932',
        'the cheese rolling competition of Gloucestershire',
      ];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      return {
        damage: 0, heal: 0,
        status: STATUS.CONFUSED,
        text: `Josh tells everyone about ${topic}. Everyone is CONFUSED!`,
        sfx: null,
      };
    },
  },

  attackJosh: {
    name: 'ATTACK',
    power: 25,
    accuracy: 95,
    target: 'enemy',
    category: 'ability',
    text: 'Josh used ATTACK! A solid dad punch.',
  },

  // Junie (party)
  useTheBox: {
    name: 'USE THE BOX',
    power: 0,
    accuracy: 100,
    target: 'all',
    category: 'ability',
    emoji: '\u{1F4E6}',
    resolve(user, target) {
      const isEnemy = user.isEnemy;
      const effects = {
        chrys: isEnemy
          ? { text: 'Junie used THE BOX! Chrys feels sick!', status: STATUS.SICK }
          : { text: 'Junie used THE BOX! Chrys pretends not to notice.', sfx: null },
        josh: { text: 'Junie used THE BOX! Josh laughs. No effect.', sfx: null },
        junie: { text: 'Junie used THE BOX! ...it\'s her box. She\'s proud.', sfx: null },
        thorny: { text: 'Junie used THE BOX! Thorny is unimpressed.', sfx: null },
        jp: { text: 'Junie used THE BOX! JP does not understand.', sfx: null },
        evilJunie: { text: 'Junie used THE BOX! Evil Junie is offended.', sfx: null },
      };
      const e = effects[target.id] || { text: `Junie used THE BOX! No effect.`, sfx: null };
      return { damage: 0, heal: 0, status: e.status || null, text: e.text, sfx: e.sfx || null };
    },
  },

  begForTreats: {
    name: 'BEG FOR TREATS',
    power: 0,
    accuracy: 100,
    target: 'self',
    category: 'ability',
    emoji: '\u{1F97A}',
    text: 'Junie used BEG FOR TREATS! Those eyes are irresistible...',
    special: 'junieBegging',
    sfx: null,
  },

  zoomies: {
    name: 'ZOOMIES',
    power: 80,
    accuracy: 100,
    target: 'all_enemies',
    category: 'ability',
    emoji: '\u{1F4A8}',
    text: 'Junie used ZOOMIES! She\'s EVERYWHERE at once! MASSIVE DAMAGE!',
    requiresFlag: 'junieBegging',
  },

  judgement: {
    name: 'JUDGEMENT',
    power: 30,
    accuracy: 100,
    target: 'enemy',
    category: 'ability',
    emoji: '\u{1F440}',
    text: 'Junie used JUDGEMENT! She stares into your SOUL. Massive damage!',
  },

  cutenessOverload: {
    name: 'CUTENESS OVERLOAD',
    power: 0,
    accuracy: 100,
    target: 'all_allies',
    category: 'ability',
    emoji: '\u{1F431}',
    text: 'Junie used CUTENESS OVERLOAD! Everyone is healed to full!',
    sfx: 'heal',
    special: 'autoHeal',
  },
};

// ─── Items ────────────────────────────────────────────────────
export const ITEMS = {
  temptingTuna: {
    name: 'Tempting Tuna',
    target: 'any',
    category: 'item',
    maxCount: 2,
    owner: 'chrys',
    emoji: '\u{1F41F}',
    resolve(user, target) {
      const effects = {
        junie: { text: 'Used Tempting Tuna! Junie LOVES it! Big heal!', heal: 50, sfx: 'heal' },
        evilJunie: { text: 'Used Tempting Tuna! Evil Junie LOVES it! Big heal!', heal: 50, sfx: 'heal' },
        chrys: { text: 'Chrys ate Tempting Tuna! ...she feels sick.', status: STATUS.SICK, sfx: null },
        josh: { text: 'Josh ate Tempting Tuna! ...he feels sick.', status: STATUS.SICK, sfx: null },
        thorny: { text: 'Thorny sniffs the Tempting Tuna. Immune. He\'s above this.', sfx: null },
      };
      const e = effects[target.id] || { text: `Used Tempting Tuna on ${target.name}!`, sfx: null };
      return { damage: 0, heal: e.heal || 0, status: e.status || null, text: e.text, sfx: e.sfx || null };
    },
  },

  savorySalmon: {
    name: 'Savory Salmon',
    target: 'any',
    category: 'item',
    maxCount: 2,
    owner: 'chrys',
    emoji: '\u{1F41F}',
    resolve(user, target) {
      const effects = {
        junie: { text: 'Used Savory Salmon! Junie nibbles. Small heal.', heal: 15, sfx: 'heal' },
        evilJunie: { text: 'Used Savory Salmon! Evil Junie nibbles. Small heal.', heal: 15, sfx: 'heal' },
        chrys: { text: 'Chrys ate Savory Salmon! ...she feels sick.', status: STATUS.SICK, sfx: null },
        josh: { text: 'Josh ate Savory Salmon! ...he feels sick.', status: STATUS.SICK, sfx: null },
        thorny: { text: 'Thorny ignores the Savory Salmon. He\'s above this.', sfx: null },
      };
      const e = effects[target.id] || { text: `Used Savory Salmon on ${target.name}!`, sfx: null };
      return { damage: 0, heal: e.heal || 0, status: e.status || null, text: e.text, sfx: e.sfx || null };
    },
  },

  pillPocket: {
    name: 'Pill Pocket',
    target: 'all',
    category: 'item',
    maxCount: 1,
    owner: 'chrys',
    emoji: '\u{1F48A}',
    resolve(user, target) {
      const effects = {
        thorny: { text: 'Thorny ate the Pill Pocket! He\'s... getting sleepy...', status: STATUS.ASLEEP, heal: 0, sfx: null },
        chrys: { text: 'The Pill Pocket heals Chrys! (She gags a little.)', heal: 999, clearStatus: true, sfx: 'heal' },
        josh: { text: 'The Pill Pocket heals Josh! (He gags a lot.)', heal: 999, clearStatus: true, sfx: 'heal' },
        junie: { text: 'The Pill Pocket heals Junie! Full restore!', heal: 999, clearStatus: true, sfx: 'heal' },
        evilJunie: { text: 'Evil Junie sniffs the Pill Pocket. Not interested.', sfx: null },
      };
      const e = effects[target.id] || { text: `Used Pill Pocket on ${target.name}!`, sfx: null };
      return {
        damage: 0, heal: e.heal || 0,
        status: e.status || null,
        clearStatus: e.clearStatus || false,
        text: e.text, sfx: e.sfx || null,
      };
    },
  },

  goldfish: {
    name: 'Goldfish',
    target: 'any',
    category: 'item',
    maxCount: 3,
    owner: 'chrys',
    emoji: '\u{1F41F}',
    resolve(user, target) {
      const effects = {
        chrys: { text: 'Chrys eats a Goldfish cracker! Big heal!', heal: 40, sfx: 'heal' },
        junie: { text: 'Junie sees the Goldfish! She\'s distracted! Confused!', status: STATUS.CONFUSED, sfx: null },
        evilJunie: { text: 'Evil Junie sees the Goldfish! She\'s distracted! Confused!', status: STATUS.CONFUSED, sfx: null },
        thorny: { text: 'Thorny sees the Goldfish... he\'s confused. Is it real?', status: STATUS.CONFUSED, sfx: null },
        josh: { text: 'Josh eats a Goldfish cracker. It\'s fine.', heal: 10, sfx: 'heal' },
      };
      const e = effects[target.id] || { text: `Used Goldfish on ${target.name}!`, sfx: null };
      return { damage: 0, heal: e.heal || 0, status: e.status || null, text: e.text, sfx: e.sfx || null };
    },
  },

  redBull: {
    name: 'Red Bull',
    target: 'self',
    category: 'item',
    maxCount: 2,
    owner: 'josh',
    emoji: '\u26A1',
    resolve(user, target) {
      return {
        damage: 0, heal: 0, status: null,
        text: 'Josh chugs a Red Bull! EXTRA TURN!',
        sfx: 'heal',
        special: 'extraTurn',
      };
    },
  },
};

// ─── Ball Pikachu ─────────────────────────────────────────────
export const BALL_PIKACHU = {
  name: 'Ball Pikachu',
  power: 0,
  accuracy: 100,
  target: 'enemy',
  category: 'ball',
  resolve(user, target, state) {
    // Against Junie in encounter 1: actually works!
    if (target.id === 'junieWild' && state && state.encounterKey === 'catchJunie') {
      return {
        damage: 0, heal: 0, status: null,
        text: 'Chrys threw Ball Pikachu!',
        sfx: null,
        special: 'catchJunie',
      };
    }
    // Chrys throws it
    if (user.id === 'chrys') {
      return {
        damage: 0, heal: 0, status: null,
        text: `${user.name} threw Ball Pikachu! ...Josh was a Final Fantasy kid. Nothing happens.`,
        sfx: null,
      };
    }
    // Josh throws it
    if (user.id === 'josh') {
      return {
        damage: 0, heal: 0, status: null,
        text: 'Josh threw Ball Pikachu! ...Josh did computers, not baseballs. Nothing happens.',
        sfx: null,
      };
    }
    return {
      damage: 0, heal: 0, status: null,
      text: 'Ball Pikachu bounced off harmlessly.',
      sfx: null,
    };
  },
};

// ─── Defend ───────────────────────────────────────────────────
export const DEFEND = {
  name: 'DEFEND',
  power: 0,
  accuracy: 100,
  target: 'self',
  category: 'defend',
  text: '{name} braces for impact!',
  special: 'defend',
};

// ─── Enemy Moves ──────────────────────────────────────────────
export const ENEMY_MOVES = {
  // Wild Junie
  zoomiesEnemy: {
    name: 'ZOOMIES', power: 15, accuracy: 90,
    text: '{name} used ZOOMIES! She\'s everywhere at once!',
  },
  begForTreatsEnemy: {
    name: 'BEG FOR TREATS', power: 0, accuracy: 100,
    text: '{name} used BEG FOR TREATS! Those eyes...',
    heal: 10, target: 'self', special: 'selfHeal',
  },
  judgeYouEnemy: {
    name: 'JUDGE YOU', power: 12, accuracy: 100,
    text: '{name} used JUDGE YOU! She stares disapprovingly.',
  },
  sneakAwayEnemy: {
    name: 'SNEAK AWAY', power: 0, accuracy: 100,
    text: '{name} used SNEAK AWAY! HER BEEF\'S WRONG!',
    special: 'skip',
  },

  // Rock Pikachu
  rockThrow: {
    name: 'ROCK THROW', power: 15, accuracy: 80,
    text: 'Rock Pikachu used ROCK THROW! A rock hits you. It is a rock.',
  },
  harden: {
    name: 'HARDEN', power: 0, accuracy: 100,
    text: 'Rock Pikachu used HARDEN! It\'s already a rock. How much harder can it get?',
    special: 'buff',
  },
  tackle: {
    name: 'TACKLE', power: 12, accuracy: 90,
    text: 'Rock Pikachu used TACKLE! It rolled at you menacingly.',
  },

  // Fire Pikachu
  burnDinner: {
    name: 'BURN DINNER', power: 20, accuracy: 40,
    text: 'Fire Pikachu used BURN DINNER!',
    missText: 'Fire Pikachu used BURN DINNER! ...but it missed! Dinner is ruined.',
  },
  flameOn: {
    name: 'FLAME ON', power: 18, accuracy: 85,
    text: 'Fire Pikachu used FLAME ON! It\'s getting hot in here.',
  },
  ember: {
    name: 'EMBER', power: 12, accuracy: 90,
    text: 'Fire Pikachu used EMBER! Tiny fire. Very cute.',
  },

  // Lightning Pikachu
  shock: {
    name: 'STATIC SHOCK', power: 15, accuracy: 85,
    text: 'Lightning Pikachu used STATIC SHOCK! Zzzap!',
  },
  thunderDerp: {
    name: 'THUNDER DERP', power: 20, accuracy: 70,
    text: 'Lightning Pikachu used THUNDER DERP!',
    missText: 'Lightning Pikachu used THUNDER DERP! It hurt itself in confusion!',
  },
  spark: {
    name: 'SPARK', power: 12, accuracy: 95,
    text: 'Lightning Pikachu used SPARK! Bzzzt.',
  },

  // JP
  adiosTurdNuggets: {
    name: 'ADIOS TURD NUGGETS', power: 40, accuracy: 90,
    text: 'JP used ADIOS TURD NUGGETS! Massive damage!',
  },
  featherBoa: {
    name: 'FEATHER BOA', power: 0, accuracy: 100,
    text: 'JP: "Gonna get you a feather boa."',
    resolve(user, target) {
      // This is handled per-target in the engine for enemy moves
      return null;
    },
    special: 'featherBoa',
  },
  blendIntoWall: {
    name: 'BLEND INTO WALL', power: 0, accuracy: 100,
    text: 'JP: "How can they see me?" ...Nothing happens.',
    special: 'skip',
  },

  // Thorny
  loaf: {
    name: 'LOAF', power: 0, accuracy: 100,
    text: 'Thorny used LOAF! He\'s just... sitting there. Being cute.',
    special: 'skip',
  },
  showTheBelly: {
    name: 'SHOW THE BELLY', power: 0, accuracy: 100,
    text: 'Thorny shows his belly! It looks so soft and inviting...',
    special: 'bellyTrap',
  },
  thornyHiss: {
    name: 'HISS', power: 0, accuracy: 100,
    text: 'Thorny used HISS!',
    special: 'hiss',
  },
  lazySwipe: {
    name: 'LAZY SWIPE', power: 15, accuracy: 90,
    text: 'Thorny used LAZY SWIPE! Barely tried.',
  },

  // Evil Junie (boss) - reduced power, she shouldn't do real damage
  evilZoomies: {
    name: 'EVIL ZOOMIES', power: 5, accuracy: 90,
    text: 'Evil Junie used EVIL ZOOMIES! ...it\'s not very menacing.',
  },
  evilJudge: {
    name: 'EVIL JUDGE', power: 3, accuracy: 100,
    text: 'Evil Junie used EVIL JUDGE! She tries to look scary but she\'s still cute.',
  },
};

// Get an action by key from abilities, items, enemy moves, or specials
export function getAction(key) {
  return ABILITIES[key] || ITEMS[key] || ENEMY_MOVES[key] || null;
}
