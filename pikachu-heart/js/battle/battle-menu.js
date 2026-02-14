// Two-tier battle menu: category → action → target
// Renders in bottom 160px area
import { WIDTH, HEIGHT, fillRect, drawText } from '../engine/canvas.js';
import { sfx } from '../engine/sfx.js';
import { ABILITIES, ITEMS, BALL_PIKACHU, DEFEND, getAction } from '../data/actions.js';

const MENU_Y = HEIGHT - 160;
const MENU_H = 160;

const TIER = {
  CATEGORY: 'category',
  ACTION: 'action',
  SUB_ACTION: 'sub_action',
  TARGET: 'target',
};

export class BattleMenu {
  constructor() {
    this.tier = TIER.CATEGORY;
    this.selectedCategory = null;
    this.selectedAction = null;
    this.activeCombatant = null;
    this.itemCounts = {};
    this.battleState = {};
    this.onActionSelected = null;
    this.visible = false;
    this.enemies = [];
    this.party = [];
  }

  open(combatant, party, enemies, itemCounts, battleState, onActionSelected) {
    this.activeCombatant = combatant;
    this.party = party.filter(p => p.alive);
    this.enemies = enemies.filter(e => e.alive);
    this.itemCounts = itemCounts;
    this.battleState = battleState || {};
    this.onActionSelected = onActionSelected;
    this.tier = TIER.CATEGORY;
    this.selectedCategory = null;
    this.selectedAction = null;
    this.visible = true;
  }

  close() {
    this.visible = false;
  }

  handleTap(x, y) {
    if (!this.visible) return false;

    if (this.tier === TIER.CATEGORY) {
      return this._handleCategoryTap(x, y);
    } else if (this.tier === TIER.ACTION) {
      return this._handleActionTap(x, y);
    } else if (this.tier === TIER.SUB_ACTION) {
      return this._handleSubActionTap(x, y);
    } else if (this.tier === TIER.TARGET) {
      return this._handleTargetTap(x, y);
    }
    return false;
  }

  _handleCategoryTap(x, y) {
    const buttons = this._getCategoryButtons();
    for (const btn of buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        sfx.menuSelect();
        this.selectedCategory = btn.key;
        if (btn.key === 'ball') {
          this.selectedAction = BALL_PIKACHU;
          this.tier = TIER.TARGET;
        } else if (btn.key === 'defend') {
          this.close();
          if (this.onActionSelected) {
            this.onActionSelected(DEFEND, [this.activeCombatant]);
          }
        } else {
          this.tier = TIER.ACTION;
        }
        return true;
      }
    }
    return false;
  }

  _handleActionTap(x, y) {
    const buttons = this._getActionButtons();
    for (const btn of buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        if (btn.disabled) return true;
        sfx.menuSelect();
        this.selectedAction = btn.action;

        const action = btn.action;

        // Netflix sub-menu: show sub-actions
        if (action.subActions) {
          this.tier = TIER.SUB_ACTION;
          return true;
        }

        this._resolveActionTarget(action);
        return true;
      }
    }

    if (this._checkBackButton(x, y)) {
      this.tier = TIER.CATEGORY;
      sfx.menuSelect();
      return true;
    }
    return false;
  }

  _handleSubActionTap(x, y) {
    const buttons = this._getSubActionButtons();
    for (const btn of buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        if (btn.disabled) return true;
        sfx.menuSelect();
        this.selectedAction = btn.action;
        this._resolveActionTarget(btn.action);
        return true;
      }
    }

    if (this._checkBackButton(x, y)) {
      this.tier = TIER.ACTION;
      sfx.menuSelect();
      return true;
    }
    return false;
  }

  _resolveActionTarget(action) {
    if (action.target === 'self') {
      this.close();
      if (this.onActionSelected) {
        this.onActionSelected(action, [this.activeCombatant]);
      }
    } else if (action.target === 'all_enemies') {
      this.close();
      if (this.onActionSelected) {
        this.onActionSelected(action, this.enemies);
      }
    } else if (action.target === 'all_allies') {
      this.close();
      if (this.onActionSelected) {
        this.onActionSelected(action, this.party);
      }
    } else if (action.target === 'all') {
      // All combatants — auto-target
      this.close();
      if (this.onActionSelected) {
        this.onActionSelected(action, [...this.party, ...this.enemies]);
      }
    } else if (action.target === 'ally') {
      if (this.party.length === 1) {
        this.close();
        if (this.onActionSelected) {
          this.onActionSelected(action, [this.party[0]]);
        }
      } else {
        this.tier = TIER.TARGET;
      }
    } else if (action.target === 'any') {
      // Can target allies OR enemies
      this.tier = TIER.TARGET;
    } else if (action.target === 'enemy') {
      if (this.enemies.length === 1) {
        this.close();
        if (this.onActionSelected) {
          this.onActionSelected(action, [this.enemies[0]]);
        }
      } else {
        this.tier = TIER.TARGET;
      }
    } else {
      this.tier = TIER.TARGET;
    }
  }

  _handleTargetTap(x, y) {
    const buttons = this._getTargetButtons();
    for (const btn of buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        sfx.menuConfirm();
        this.close();
        if (this.onActionSelected) {
          this.onActionSelected(this.selectedAction, [btn.combatant]);
        }
        return true;
      }
    }

    if (this._checkBackButton(x, y)) {
      // Go back to appropriate tier
      if (this.selectedCategory === 'ball') {
        this.tier = TIER.CATEGORY;
      } else if (this.selectedAction && this.selectedAction.subActions) {
        this.tier = TIER.SUB_ACTION;
      } else {
        this.tier = TIER.ACTION;
      }
      sfx.menuSelect();
      return true;
    }
    return false;
  }

  _checkBackButton(x, y) {
    const bx = WIDTH - 60;
    const by = MENU_Y + 2;
    return x >= bx && x <= bx + 50 && y >= by && y <= by + 22;
  }

  _getCategoryButtons() {
    const btnW = (WIDTH - 30) / 2;
    const btnH = 45;
    const startY = MENU_Y + 30;
    return [
      { key: 'ability', label: 'ABILITY', x: 10, y: startY, w: btnW, h: btnH, color: '#345' },
      { key: 'item', label: 'ITEM', x: 10 + btnW + 10, y: startY, w: btnW, h: btnH, color: '#354' },
      { key: 'ball', label: 'BALL PIKACHU', x: 10, y: startY + btnH + 8, w: btnW, h: btnH, color: '#543' },
      { key: 'defend', label: 'DEFEND', x: 10 + btnW + 10, y: startY + btnH + 8, w: btnW, h: btnH, color: '#444' },
    ];
  }

  _getActionButtons() {
    const actions = this._getActionsForCategory();
    const btnW = (WIDTH - 30) / 2;
    const btnH = 45;
    const startY = MENU_Y + 30;

    return actions.map((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      return {
        action: item.action,
        label: item.label,
        disabled: item.disabled,
        x: 10 + col * (btnW + 10),
        y: startY + row * (btnH + 8),
        w: btnW,
        h: btnH,
      };
    });
  }

  _getSubActionButtons() {
    const parentAction = this.selectedAction;
    if (!parentAction || !parentAction.subActions) return [];

    const subKeys = parentAction.subActions;
    const btnW = (WIDTH - 30) / 2;
    const btnH = 45;
    const startY = MENU_Y + 30;

    return subKeys.map((key, i) => {
      const action = ABILITIES[key];
      const col = i % 2;
      const row = Math.floor(i / 2);
      return {
        action,
        label: action ? action.name : key,
        disabled: false,
        x: 10 + col * (btnW + 10),
        y: startY + row * (btnH + 8),
        w: btnW,
        h: btnH,
      };
    });
  }

  _getActionsForCategory() {
    if (this.selectedCategory === 'ability') {
      const abilityKeys = this.activeCombatant.abilities || [];
      return abilityKeys.map(key => {
        const action = ABILITIES[key];
        if (!action) return { action: null, label: key, disabled: true };

        // Gray out Zoomies if junieBegging flag is not set
        let disabled = false;
        if (action.requiresFlag === 'junieBegging' && !this.battleState.junieBegging) {
          disabled = true;
        }

        return { action, label: action.name, disabled };
      });
    }

    if (this.selectedCategory === 'item') {
      // Filter items by owner
      const combatantId = this.activeCombatant.id;
      return Object.entries(ITEMS)
        .filter(([key, item]) => item.owner === combatantId)
        .map(([key, item]) => {
          const count = this.itemCounts[key] || 0;
          return {
            action: item,
            label: `${item.name} (${count})`,
            disabled: count <= 0,
          };
        });
    }

    return [];
  }

  _getTargetButtons() {
    const action = this.selectedAction;
    let targets;

    if (action && action.target === 'any') {
      // Combined: allies + enemies
      targets = [...this.party, ...this.enemies];
    } else if (action && action.target === 'ally') {
      targets = this.party;
    } else {
      targets = this.enemies;
    }

    const btnW = WIDTH - 40;
    const btnH = 35;
    const startY = MENU_Y + 30;

    return targets.map((combatant, i) => ({
      combatant,
      label: `${combatant.name} (${combatant.hp}/${combatant.maxHp})`,
      x: 20,
      y: startY + i * (btnH + 6),
      w: btnW,
      h: btnH,
    }));
  }

  render(ctx) {
    if (!this.visible) return;

    fillRect(0, MENU_Y - 10, WIDTH, MENU_H + 10, '#222');

    if (this.tier === TIER.CATEGORY) {
      this._renderCategory(ctx);
    } else if (this.tier === TIER.ACTION) {
      this._renderActions(ctx);
    } else if (this.tier === TIER.SUB_ACTION) {
      this._renderSubActions(ctx);
    } else if (this.tier === TIER.TARGET) {
      this._renderTargets(ctx);
    }
  }

  _renderCategory(ctx) {
    const name = this.activeCombatant ? this.activeCombatant.name : '???';
    drawText(`${name}'s turn!`, 15, MENU_Y, 12, '#ffcc00');

    const buttons = this._getCategoryButtons();
    for (const btn of buttons) {
      fillRect(btn.x, btn.y, btn.w, btn.h, btn.color);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
      const fontSize = btn.label.length > 10 ? 10 : 12;
      drawText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 - fontSize / 2, fontSize, '#fff', 'center');
    }
  }

  _renderActions(ctx) {
    const catLabel = this.selectedCategory === 'ability' ? 'Abilities' : 'Items';
    drawText(`${catLabel} - ${this.activeCombatant.name}`, 15, MENU_Y, 12, '#ffcc00');
    this._renderBackButton(ctx);

    const buttons = this._getActionButtons();
    for (const btn of buttons) {
      const color = btn.disabled ? '#1a1a1a' : '#333';
      const textColor = btn.disabled ? '#555' : '#fff';
      fillRect(btn.x, btn.y, btn.w, btn.h, color);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
      const fontSize = btn.label.length > 14 ? 9 : btn.label.length > 10 ? 10 : 12;
      drawText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 - fontSize / 2, fontSize, textColor, 'center');
    }
  }

  _renderSubActions(ctx) {
    const parentName = this.selectedAction ? this.selectedAction.name : 'Pick a show';
    drawText(`${parentName} - Pick a show`, 15, MENU_Y, 12, '#ffcc00');
    this._renderBackButton(ctx);

    const buttons = this._getSubActionButtons();
    for (const btn of buttons) {
      const color = btn.disabled ? '#1a1a1a' : '#335';
      const textColor = btn.disabled ? '#555' : '#fff';
      fillRect(btn.x, btn.y, btn.w, btn.h, color);
      ctx.strokeStyle = '#668';
      ctx.lineWidth = 1;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
      const fontSize = btn.label.length > 14 ? 9 : btn.label.length > 10 ? 10 : 12;
      drawText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 - fontSize / 2, fontSize, textColor, 'center');
    }
  }

  _renderTargets(ctx) {
    const action = this.selectedAction;
    const label = action ? action.name : 'Select target';
    drawText(`${label} \u2192 Who?`, 15, MENU_Y, 12, '#ffcc00');
    this._renderBackButton(ctx);

    const buttons = this._getTargetButtons();
    for (const btn of buttons) {
      fillRect(btn.x, btn.y, btn.w, btn.h, '#335');
      ctx.strokeStyle = '#88f';
      ctx.lineWidth = 1;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
      drawText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 - 5, 11, '#fff', 'center');
    }
  }

  _renderBackButton(ctx) {
    const bx = WIDTH - 60;
    const by = MENU_Y + 2;
    fillRect(bx, by, 50, 22, '#533');
    drawText('BACK', bx + 25, by + 4, 10, '#fff', 'center');
  }
}
