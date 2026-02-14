// Per-encounter configuration: enemies, party, triggers, scripts, bg colors
import { PARTY_MEMBERS, ENEMY_DEFS } from './combatants.js';

export const ENCOUNTERS = {
  // ─── Encounter 1: Catch Junie ─────────────────────────────────
  catchJunie: {
    party: ['chrys'],
    enemies: ['junieWild'],
    bgColors: { sky: '#87CEEB', ground: '#6b9e5a', platform: '#5a8e4a', menu: '#222' },
    introDialogue: [
      { speaker: '', text: ENEMY_DEFS.junieWild.enterText },
    ],
    victoryScene: null,
    triggers: [
      // Ball Pikachu catch — handled via special:'catchJunie' in action resolve
      {
        id: 'ball_pikachu_catch',
        condition: (state) => state.ballPikachuCatch === true,
        action: 'catchJunieBall',
        once: true,
      },
      // Beat Junie down to 1 HP
      {
        id: 'junie_catch_hp',
        condition: (state) => {
          const junie = state.enemies.find(e => e.id === 'junieWild');
          return junie && junie.hp <= 1;
        },
        action: 'catchJunie',
        once: true,
      },
      // Safety net: if Chrys HP drops to 1, Junie joins anyway
      {
        id: 'chrys_low_hp',
        condition: (state) => {
          const chrys = state.party.find(p => p.id === 'chrys');
          return chrys && chrys.hp <= 1;
        },
        action: 'catchJunieSafety',
        once: true,
      },
    ],
    scripts: {
      catchJunieBall: [
        { speaker: '', text: 'Ball Pikachu wobbles... wobbles...' },
        { speaker: '', text: 'Junie was caught!' },
        { speaker: '', text: 'Junie joins your party!' },
      ],
      catchJunie: [
        { speaker: '', text: 'Junie is exhausted... she gives up and follows you!' },
        { speaker: '', text: 'Junie joins your party!' },
      ],
      catchJunieSafety: [
        { speaker: '', text: 'Chrys is about to fall...' },
        { speaker: 'Junie', text: '...meow.' },
        { speaker: '', text: 'Junie shrugs and joins you anyway. She was bored.' },
        { speaker: '', text: 'Junie joins your party!' },
      ],
    },
    noNormalVictory: true,
  },

  // ─── Encounter 2: Rock Pikachu ────────────────────────────────
  rockBattle: {
    party: ['chrys', 'junie'],
    enemies: ['rock'],
    bgColors: { sky: '#87CEEB', ground: '#6b9e5a', platform: '#5a8e4a', menu: '#222' },
    introDialogue: [
      { speaker: '', text: ENEMY_DEFS.rock.enterText },
    ],
    victoryDialogue: [
      { speaker: '', text: ENEMY_DEFS.rock.defeatText },
    ],
    triggers: [],
    scripts: {},
  },

  // ─── Encounter 3: Fire Pikachu ────────────────────────────────
  fireBattle: {
    party: ['chrys', 'junie'],
    enemies: ['fire'],
    bgColors: { sky: '#87CEEB', ground: '#6b9e5a', platform: '#5a8e4a', menu: '#222' },
    introDialogue: [
      { speaker: '', text: ENEMY_DEFS.fire.enterText },
    ],
    victoryDialogue: [
      { speaker: '', text: ENEMY_DEFS.fire.defeatText },
    ],
    triggers: [],
    scripts: {},
  },

  // ─── Encounter 4: Lightning Pikachu ───────────────────────────
  lightningBattle: {
    party: ['chrys', 'junie'],
    enemies: ['lightning'],
    bgColors: { sky: '#87CEEB', ground: '#6b9e5a', platform: '#5a8e4a', menu: '#222' },
    introDialogue: [
      { speaker: '', text: ENEMY_DEFS.lightning.enterText },
    ],
    victoryDialogue: [
      { speaker: '', text: ENEMY_DEFS.lightning.defeatText },
    ],
    triggers: [],
    scripts: {},
  },

  // ─── Encounter 5: JP (DoppleJosher) ─────────────────────────
  jpBattle: {
    party: ['chrys', 'junie'],
    enemies: ['jp'],
    bgColors: { sky: '#2a1a3e', ground: '#3a2a4e', platform: '#4a3a5e', menu: '#222' },
    introDialogue: [
      { speaker: '???', text: 'Hold it right there.' },
      { speaker: 'JP', text: 'My name is J.P. I am a robot. I have a robot vagina.' },
      { speaker: '', text: 'JP wants to fight!' },
    ],
    triggers: [
      {
        id: 'josh_arrives',
        condition: (state) => state.round >= 2,
        action: 'joshArrives',
        once: true,
      },
    ],
    scripts: {
      // joshArrives dialogue is handled in battle-engine _applyTriggerEffects
      // so Junie's sprite can disappear mid-sequence
    },
    fleeText: 'JP tried to flee! ...But there\'s nowhere to go!',
    noNormalVictory: true,
  },

  // ─── Encounter 6: Final Boss ──────────────────────────────────
  finalBoss: {
    party: ['chrys', 'josh'],
    enemies: ['thorny', 'evilJunie'],
    bgColors: { sky: '#1a1a2e', ground: '#2a2a3e', platform: '#3a3a4e', menu: '#222' },
    introDialogue: [
      { speaker: '', text: 'Two shapes block your path...' },
      { speaker: '', text: 'It\'s Thorny and... Junie?!' },
      { speaker: 'Junie', text: 'I\'m here with Thorny now. You didn\'t give me SNACKS.' },
      { speaker: 'Thorny', text: '*hisses in agreement*' },
      { speaker: 'Junie', text: 'You gave no treat... now prepare for a beat-down!' },
      { speaker: '', text: 'Thorny and Junie are... best friends now? They\'re mad at mom and dad!' },
    ],
    triggers: [
      // Round 1: Thorny instantly KOs Josh
      {
        id: 'josh_ko',
        condition: (state) => state.round === 1,
        action: 'joshKO',
        once: true,
      },
      // Evil Junie HP low: she snaps out of it and rejoins
      {
        id: 'junie_rejoin',
        condition: (state) => {
          const evilJunie = state.enemies.find(e => e.id === 'evilJunie');
          return evilJunie && evilJunie.hp <= 30 && !state.party.find(p => p.id === 'josh' && p.alive);
        },
        action: 'junieRejoin',
        once: true,
      },
      // Thorny HP low + Evil Junie gone: Thorny naps, you win
      {
        id: 'thorny_nap',
        condition: (state) => {
          const thorny = state.enemies.find(e => e.id === 'thorny');
          const evilJunie = state.enemies.find(e => e.id === 'evilJunie');
          return thorny && thorny.hp <= 15 && (!evilJunie || !evilJunie.alive);
        },
        action: 'thornyNap',
        once: true,
      },
    ],
    scripts: {
      joshKO: [
        { speaker: '', text: 'Thorny attacks Josh! CRITICAL HIT!' },
        { speaker: 'Josh', text: 'Ow. That\'s... fair.' },
        { speaker: '', text: 'Josh has been knocked out!' },
        { speaker: '', text: 'Chrys must fight alone!' },
      ],
      junieRejoin: [
        { speaker: '', text: 'Evil Junie is wavering...' },
        { speaker: 'Junie', text: '...meow? Actually I do want treats.' },
        { speaker: '', text: 'Junie snaps out of it! She remembers she likes treats!' },
        { speaker: '', text: 'Junie rejoins your party!' },
      ],
      thornyNap: [
        { speaker: '', text: 'Thorny is exhausted from all the rage...' },
        { speaker: '', text: 'Thorny used NAP...' },
        { speaker: '', text: 'Thorny fell asleep. You win?' },
      ],
    },
    noNormalVictory: true,
  },
};

// Ordered list for BATTLE_SEQUENCE
export const ENCOUNTER_ORDER = [
  'catchJunie',
  'rockBattle',
  'fireBattle',
  'lightningBattle',
  'jpBattle',
  'finalBoss',
];
