// RPG text box with typewriter effect
import { WIDTH, HEIGHT, fillRect, drawText } from './canvas.js';
import { sfx } from './sfx.js';

const BOX_HEIGHT = 140;
const BOX_Y = HEIGHT - BOX_HEIGHT - 10;
const BOX_X = 10;
const BOX_WIDTH = WIDTH - 20;
const PADDING = 14;
const LINE_HEIGHT = 22;
const CHAR_DELAY = 0.03; // seconds per character
const MAX_LINE_WIDTH = BOX_WIDTH - PADDING * 2;

export class DialogueBox {
  constructor() {
    this.lines = [];
    this.queue = [];
    this.speaker = '';
    this.charIndex = 0;
    this.timer = 0;
    this.active = false;
    this.done = false;
    this.onComplete = null;
    this.fast = false;
  }

  start(script, onComplete) {
    // script: [{ speaker, text }] or ["text", "text"]
    this.queue = script.map(entry => {
      if (typeof entry === 'string') return { speaker: '', text: entry };
      return entry;
    });
    this.onComplete = onComplete;
    this.done = false;
    this.active = true;
    this.nextPage();
  }

  nextPage() {
    if (this.queue.length === 0) {
      this.active = false;
      this.done = true;
      if (this.onComplete) this.onComplete();
      return;
    }

    const entry = this.queue.shift();
    this.speaker = entry.speaker || '';
    this.fullText = entry.text;
    this.lines = this.wrapText(entry.text);
    this.charIndex = 0;
    this.timer = 0;
    this.fast = false;
  }

  wrapText(text) {
    const words = text.split(' ');
    const lines = [];
    let line = '';

    // Monospace at 14px is ~8.4px per char; use 9 for safety margin
    const maxChars = Math.floor(MAX_LINE_WIDTH / 9);

    for (const word of words) {
      if (line.length + word.length + 1 > maxChars) {
        lines.push(line);
        line = word;
      } else {
        line = line ? line + ' ' + word : word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  getTotalChars() {
    return this.lines.reduce((sum, l) => sum + l.length, 0);
  }

  isTyping() {
    return this.active && this.charIndex < this.getTotalChars();
  }

  tap() {
    if (!this.active) return;

    if (this.isTyping()) {
      // Speed up / complete current page
      this.charIndex = this.getTotalChars();
      this.fast = true;
    } else {
      // Advance to next page
      this.nextPage();
    }
  }

  update(dt) {
    if (!this.active || !this.isTyping()) return;

    this.timer += dt;
    const delay = this.fast ? 0.005 : CHAR_DELAY;

    while (this.timer >= delay && this.charIndex < this.getTotalChars()) {
      this.timer -= delay;
      this.charIndex++;
      if (!this.fast && this.charIndex % 2 === 0) sfx.textBlip();
    }
  }

  render(ctx) {
    if (!this.active) return;

    // Draw box background
    fillRect(BOX_X, BOX_Y, BOX_WIDTH, BOX_HEIGHT, 'rgba(0, 0, 0, 0.85)');
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(BOX_X + 1, BOX_Y + 1, BOX_WIDTH - 2, BOX_HEIGHT - 2);

    // Speaker name
    let textY = BOX_Y + PADDING;
    if (this.speaker) {
      drawText(this.speaker, BOX_X + PADDING, textY, 14, '#ffcc00');
      textY += LINE_HEIGHT;
    }

    // Draw text with typewriter effect
    let charsDrawn = 0;
    for (const line of this.lines) {
      let visibleLine = '';
      for (let i = 0; i < line.length; i++) {
        if (charsDrawn < this.charIndex) {
          visibleLine += line[i];
          charsDrawn++;
        } else {
          break;
        }
      }
      drawText(visibleLine, BOX_X + PADDING, textY, 14, '#fff');
      if (charsDrawn >= this.charIndex) break;
      textY += LINE_HEIGHT;
    }

    // Draw continue indicator if done typing
    if (!this.isTyping()) {
      const blink = Math.floor(Date.now() / 400) % 2;
      if (blink) {
        drawText('\u25BC', BOX_X + BOX_WIDTH - PADDING - 10, BOX_Y + BOX_HEIGHT - PADDING - 10, 12, '#fff');
      }
    }
  }
}
