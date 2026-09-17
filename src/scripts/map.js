// Constant Canvas/SVG Map Controller

import { audioSystem } from './audio.js';

export class OdysseyMap {
  constructor(containerId, wrapperId, onSymbolSelect) {
    this.container = document.getElementById(containerId);
    this.wrapper = document.getElementById(wrapperId);
    this.onSymbolSelect = onSymbolSelect;

    this.init();
  }

  init() {
    if (!this.container || !this.wrapper) return;

    // Pin Click Handlers for the 5 Symbols
    const pins = document.querySelectorAll('.map-pin');
    pins.forEach(pin => {
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        audioSystem.playClick();
        const symbolId = pin.getAttribute('data-symbol');
        if (symbolId && this.onSymbolSelect) {
          // Map stays completely CONSTANT - no pan or zoom shifts
          this.onSymbolSelect(symbolId);
        }
      });
    });
  }

  // Kept constant without view shift
  resetView() {
    if (this.wrapper) {
      this.wrapper.style.transform = 'none';
    }
  }
}
