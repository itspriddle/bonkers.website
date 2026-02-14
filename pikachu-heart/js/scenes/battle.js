// Battle scene: thin wrapper over BattleEngine
import { BattleEngine } from '../battle/battle-engine.js';
import { ENCOUNTER_ORDER } from '../data/encounters.js';

let engine = null;

export const battleScene = {
  enter(data) {
    const battleIndex = (data && data.battleIndex !== undefined) ? data.battleIndex : 0;
    const encounterKey = ENCOUNTER_ORDER[battleIndex] || ENCOUNTER_ORDER[0];
    engine = new BattleEngine(encounterKey, battleIndex);
  },

  update(dt) {
    if (engine) engine.update(dt);
  },

  onInput(type, data) {
    if (engine) engine.onInput(type, data);
  },

  render(ctx) {
    if (engine) engine.render(ctx);
  },
};
