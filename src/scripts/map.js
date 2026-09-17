// Dynamic Top-Down Virtual Scroll & Drag Driven Odyssey Map Controller

import { audioSystem } from './audio.js';

export class OdysseyMap {
  constructor(containerId, wrapperId, onSymbolSelect) {
    this.container = document.getElementById(containerId);
    this.wrapper = document.getElementById(wrapperId);
    this.section = document.getElementById('map-view');
    this.onSymbolSelect = onSymbolSelect;

    // 3 Distinct Parallax Depth Layers
    this.layerBg = document.getElementById('map-layer-bg');
    this.layerMg = document.getElementById('map-layer-mg');
    this.layerFg = document.getElementById('map-layer-fg');
    this.scrollIndicator = document.getElementById('map-scroll-indicator');

    // Slide Controls UI
    this.btnPrev = document.getElementById('map-slide-prev');
    this.btnNext = document.getElementById('map-slide-next');
    this.timelineHud = document.getElementById('voyage-timeline-hud');
    this.timelineTrack = document.getElementById('timeline-track-container');
    this.timelineFill = document.getElementById('timeline-track-fill');
    this.shipMarker = document.getElementById('timeline-ship-marker');
    this.milestoneNodes = document.querySelectorAll('.timeline-milestone-node');
    this.quickInfoStep = document.querySelector('#timeline-quick-info .info-step');
    this.quickInfoRealm = document.querySelector('#timeline-quick-info .info-realm');

    // 5 Realms in Top-Down Progression Order
    this.realms = [
      { id: 'voyage', name: 'The Voyage', step: 1, topPct: 0.16, leftPct: 0.46 },
      { id: 'realms', name: 'The Realms', step: 2, topPct: 0.33, leftPct: 0.56 },
      { id: 'protocols', name: 'Protocols', step: 3, topPct: 0.50, leftPct: 0.42 },
      { id: 'legions', name: 'The Legions', step: 4, topPct: 0.67, leftPct: 0.58 },
      { id: 'odyssey', name: 'The Odyssey', step: 5, topPct: 0.84, leftPct: 0.48 }
    ];

    // Top-Down Voyage Configuration (1:1 scroll reveals full background canvas & bottom message)
    this.config = {
      bgSpeed: 1.0,       // Background layer scrolls 100% to reveal entire bottom artwork & text
      mgSpeed: 1.0,       // Midground layer stays synchronized
      fgSpeed: 1.0,       // Foreground interactive layer moves at 100% speed
    };

    // State
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.currentRealmIndex = 0;

    // Drag / Touch State (Vertical & Horizontal)
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartX = 0;
    this.dragStartProgress = 0;
    this.lastPointerY = 0;
    this.lastPointerTime = 0;
    this.velocity = 0;

    // Timeline Dragging State
    this.isTimelineDragging = false;
    this.prefersReducedMotion = false;

    this.init();
  }

  init() {
    if (!this.container || !this.wrapper) return;

    // 1. Check for prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = motionQuery.matches;
    motionQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      if (this.prefersReducedMotion) {
        this.resetView();
      } else {
        this.requestUpdate();
      }
    });

    // 2. Setup Pin Click Handlers for the 5 Symbols
    const pins = document.querySelectorAll('.map-pin');
    pins.forEach(pin => {
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        audioSystem.playClick();
        const symbolId = pin.getAttribute('data-symbol');
        if (symbolId && this.onSymbolSelect) {
          this.onSymbolSelect(symbolId);
        }
      });

      const clickLabel = pin.querySelector('.pin-click-label');
      if (clickLabel) {
        clickLabel.addEventListener('click', (e) => {
          e.stopPropagation();
          audioSystem.playClick();
          const symbolId = pin.getAttribute('data-symbol');
          if (symbolId && this.onSymbolSelect) {
            this.onSymbolSelect(symbolId);
          }
        });
      }
    });

    // 3. Top-Down Virtual Scroll Engine (Mouse Wheel anywhere on map)
    this.setupVirtualScroll();

    // 4. Drag & Touch Swipe Gesture Navigation (Top-Down)
    this.setupDragNavigation();

    // 5. Setup Slide Arrow Buttons (Prev / Next Realm)
    this.setupArrowButtons();

    // 6. Setup Voyage Timeline Slider HUD
    this.setupTimelineSlider();

    // 7. Setup Keyboard Navigation (Up/Down and Left/Right keys)
    this.setupKeyboardNavigation();

    // 8. Start continuous 60fps RAF Render Loop
    this.startRenderLoop();

    // Handle window resize
    window.addEventListener('resize', () => {
      this.requestUpdate();
    }, { passive: true });

    // Initial render
    this.requestUpdate();
  }

  /**
   * Top-Down Virtual Scroll Engine:
   * Mouse wheel down sails down the map (North -> South).
   * Mouse wheel up sails up the map (South -> North).
   */
  setupVirtualScroll() {
    window.addEventListener('wheel', (e) => {
      if (!document.body.classList.contains('home-view-active')) return;

      if (e.target.closest('.modal-card') || e.target.closest('.subpage-container')) {
        return;
      }

      e.preventDefault();

      // Determine delta from vertical or horizontal wheel
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      
      // Smooth dynamic sensitivity
      const sensitivity = 0.00085;
      this.targetProgress = Math.min(Math.max(this.targetProgress + (delta * sensitivity), 0), 1);
    }, { passive: false });
  }

  /**
   * Pointer Drag & Touch Swipe with Vertical / Top-Down Physics
   */
  setupDragNavigation() {
    const onPointerDown = (e) => {
      if (!document.body.classList.contains('home-view-active')) return;
      if (e.target.closest('button') || e.target.closest('.map-pin') || e.target.closest('.voyage-timeline-slider-hud')) {
        return;
      }

      this.isDragging = true;
      this.dragStartY = e.clientY;
      this.dragStartX = e.clientX;
      this.lastPointerY = e.clientY;
      this.dragStartProgress = this.targetProgress;
      this.lastPointerTime = performance.now();
      this.velocity = 0;

      this.container.classList.add('is-dragging');
      if (e.pointerId !== undefined && this.container.setPointerCapture) {
        try { this.container.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;

      const stageHeight = this.wrapper ? this.wrapper.offsetHeight : 0;
      const viewportHeight = window.innerHeight;
      const maxPanY = Math.max(1, stageHeight - viewportHeight);

      const deltaY = e.clientY - this.dragStartY;
      const now = performance.now();
      const timeDelta = Math.max(1, now - this.lastPointerTime);
      this.velocity = (e.clientY - this.lastPointerY) / timeDelta;
      this.lastPointerY = e.clientY;
      this.lastPointerTime = now;

      // Dragging up pulls map up (scrolls down towards bottom, increases progress)
      let newProgress = this.dragStartProgress - (deltaY / maxPanY);

      // Elastic resistance at boundaries
      if (newProgress < 0) {
        newProgress = newProgress * 0.25;
      } else if (newProgress > 1) {
        newProgress = 1 + (newProgress - 1) * 0.25;
      }

      this.targetProgress = newProgress;
    };

    const onPointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.container.classList.remove('is-dragging');

      if (e.pointerId !== undefined && this.container.releasePointerCapture) {
        try { this.container.releasePointerCapture(e.pointerId); } catch (_) {}
      }

      // Momentum throw
      const stageHeight = this.wrapper ? this.wrapper.offsetHeight : 0;
      const viewportHeight = window.innerHeight;
      const maxPanY = Math.max(1, stageHeight - viewportHeight);
      const momentumDelta = (this.velocity * 200) / maxPanY;

      this.targetProgress = Math.min(Math.max(this.targetProgress - momentumDelta, 0), 1);
    };

    this.container.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
  }

  /**
   * Slide Navigation Controls (Prev / Next Realm)
   */
  setupArrowButtons() {
    this.btnPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioSystem.playClick();
      this.slideStep(-1);
    });

    this.btnNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioSystem.playClick();
      this.slideStep(1);
    });
  }

  /**
   * Voyage Timeline Slider HUD at the bottom
   */
  setupTimelineSlider() {
    this.milestoneNodes.forEach(node => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        audioSystem.playClick();
        const step = parseInt(node.getAttribute('data-step'), 10);
        this.slideToRealm(step);
      });
    });

    if (this.timelineTrack) {
      const handleTrackScrub = (clientX) => {
        const rect = this.timelineTrack.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
        this.targetProgress = ratio;
      };

      this.timelineTrack.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.isTimelineDragging = true;
        handleTrackScrub(e.clientX);
      });

      window.addEventListener('pointermove', (e) => {
        if (!this.isTimelineDragging) return;
        handleTrackScrub(e.clientX);
      });

      window.addEventListener('pointerup', () => {
        if (this.isTimelineDragging) {
          this.isTimelineDragging = false;
        }
      });
    }
  }

  /**
   * Keyboard Navigation (Up/Down & Left/Right)
   */
  setupKeyboardNavigation() {
    window.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('home-view-active')) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.slideStep(-1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.slideStep(1);
      }
    });
  }

  /**
   * Slide to Next / Prev Realm
   */
  slideStep(direction) {
    const currentIdx = this.getNearestRealmIndex();
    let nextIdx = currentIdx + direction;
    nextIdx = Math.min(Math.max(nextIdx, 0), this.realms.length - 1);
    this.slideToRealm(this.realms[nextIdx].step);
  }

  /**
   * Smoothly glides the camera top-down to focus on a specific Realm (1 through 5)
   */
  slideToRealm(stepIdx) {
    const stageHeight = this.wrapper ? this.wrapper.offsetHeight : 0;
    const viewportHeight = window.innerHeight;
    const maxPanY = Math.max(1, stageHeight - viewportHeight);

    const realm = this.realms[stepIdx - 1];
    if (!realm) return;

    // Boundary snap for step 1 (top of voyage) and step 5 (bottom of voyage)
    if (stepIdx === 1) {
      this.targetProgress = 0;
      return;
    }
    if (stepIdx === 5) {
      this.targetProgress = 1;
      return;
    }

    // Top-down targets: calculate progress to center the pin vertically
    const pinY = stageHeight * realm.topPct;
    const targetY = pinY - (viewportHeight / 2);
    const progress = Math.min(Math.max(targetY / maxPanY, 0), 1);

    this.targetProgress = progress;
  }

  /**
   * Calculate which realm is currently closest to the camera center
   */
  getNearestRealmIndex() {
    const stageHeight = this.wrapper ? this.wrapper.offsetHeight : 0;
    const viewportHeight = window.innerHeight;
    const maxPanY = Math.max(0, stageHeight - viewportHeight);
    const cameraCenterY = (this.currentProgress * maxPanY) + (viewportHeight / 2);

    let nearestIdx = 0;
    let minDiff = Infinity;
    this.realms.forEach((r, idx) => {
      const pinY = stageHeight * r.topPct;
      const diff = Math.abs(cameraCenterY - pinY);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = idx;
      }
    });
    return nearestIdx;
  }

  /**
   * Main 60fps Render Loop using linear interpolation (lerp)
   */
  startRenderLoop() {
    const loop = () => {
      if (document.body.classList.contains('home-view-active') && !this.prefersReducedMotion) {
        const lerpFactor = this.isDragging ? 0.35 : 0.12;
        const delta = this.targetProgress - this.currentProgress;

        if (Math.abs(delta) > 0.0001) {
          this.currentProgress += delta * lerpFactor;
          this.renderParallax(this.currentProgress);
        } else if (this.currentProgress !== this.targetProgress) {
          this.currentProgress = this.targetProgress;
          this.renderParallax(this.currentProgress);
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  requestUpdate() {
    this.renderParallax(this.currentProgress);
  }

  /**
   * Applies GPU-accelerated transforms (Top-Down) & updates HUD
   */
  renderParallax(progress) {
    if (!this.layerBg) this.layerBg = document.getElementById('map-layer-bg');
    if (!this.layerMg) this.layerMg = document.getElementById('map-layer-mg');
    if (!this.layerFg) this.layerFg = document.getElementById('map-layer-fg');
    if (!this.scrollIndicator) this.scrollIndicator = document.getElementById('map-scroll-indicator');

    const stageHeight = this.wrapper ? this.wrapper.offsetHeight : 0;
    const stageWidth = this.wrapper ? this.wrapper.offsetWidth : 0;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const maxPanY = Math.max(0, stageHeight - viewportHeight);
    const maxPanX = Math.max(0, stageWidth - viewportWidth);

    // Fade out scroll indicator once user has slid past 4%
    if (this.scrollIndicator) {
      if (progress > 0.04) {
        this.scrollIndicator.classList.add('faded');
      } else {
        this.scrollIndicator.classList.remove('faded');
      }
    }

    // Top-down vertical translation for each depth layer
    const yFg = -progress * maxPanY * this.config.fgSpeed;
    const yMg = -progress * maxPanY * this.config.mgSpeed;
    const yBg = -progress * maxPanY * this.config.bgSpeed;

    // Subtle horizontal dynamic centering if width exceeds screen
    let xFg = 0;
    let xMg = 0;
    let xBg = 0;
    if (maxPanX > 0) {
      const nearestIdx = this.getNearestRealmIndex();
      const currentRealm = this.realms[nearestIdx];
      const pinX = currentRealm ? (stageWidth * currentRealm.leftPct) : (stageWidth / 2);
      const targetX = Math.min(Math.max(pinX - viewportWidth / 2, 0), maxPanX);
      xFg = -targetX;
      xMg = -targetX * 0.7;
      xBg = -targetX * 0.4;
    }

    // Apply hardware-accelerated transforms
    if (this.layerFg) {
      this.layerFg.style.transform = `translate3d(${xFg.toFixed(2)}px, ${yFg.toFixed(2)}px, 0)`;
    }
    if (this.layerMg) {
      this.layerMg.style.transform = `translate3d(${xMg.toFixed(2)}px, ${yMg.toFixed(2)}px, 0)`;
    }
    if (this.layerBg) {
      this.layerBg.style.transform = `translate3d(${xBg.toFixed(2)}px, ${yBg.toFixed(2)}px, 0)`;
    }

    // Update Bottom Voyage Timeline Slider HUD
    const pct = Math.min(Math.max(progress * 100, 0), 100);
    if (this.timelineFill) {
      this.timelineFill.style.width = `${pct.toFixed(2)}%`;
    }
    if (this.shipMarker) {
      this.shipMarker.style.left = `${pct.toFixed(2)}%`;
    }

    // Update nearest active milestone node & info
    const nearestIdx = this.getNearestRealmIndex();
    this.currentRealmIndex = nearestIdx;

    this.milestoneNodes.forEach((node, idx) => {
      node.classList.toggle('active', idx === nearestIdx);
    });

    const activeRealm = this.realms[nearestIdx];
    if (this.quickInfoStep && activeRealm) {
      this.quickInfoStep.textContent = `Step ${activeRealm.step} of 5`;
    }
    if (this.quickInfoRealm && activeRealm) {
      this.quickInfoRealm.textContent = activeRealm.name;
    }

    // Update Vertical Navigator Realm Badge
    const vnavStepNum = document.getElementById('vnav-step-num');
    if (vnavStepNum && activeRealm) {
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
      vnavStepNum.textContent = romanNumerals[activeRealm.step - 1] || 'I';
    }

    // Update Vertical Navigator disabled states
    if (this.btnPrev) {
      this.btnPrev.classList.toggle('disabled', progress <= 0.005);
    }
    if (this.btnNext) {
      this.btnNext.classList.toggle('disabled', progress >= 0.995);
    }
  }

  /**
   * Reset all transforms for prefers-reduced-motion
   */
  resetView() {
    if (this.layerFg) this.layerFg.style.transform = 'none';
    if (this.layerMg) this.layerMg.style.transform = 'none';
    if (this.layerBg) this.layerBg.style.transform = 'none';
    if (this.wrapper) this.wrapper.style.transform = 'none';
  }
}
