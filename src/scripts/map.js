// Animated parchment map — single voyage route + animated pins

import { audioSystem } from './audio.js';
import { SYMBOLS_DATA } from './data.js';

export const MAP_W = 1000;
export const MAP_H = 600;

const SYMBOL_ORDER = ['voyage', 'realms', 'protocols', 'legions', 'odyssey'];

function pinPoint(id) {
  const pos = SYMBOLS_DATA[id]?.mapPos;
  if (!pos) return { x: 0, y: 0 };
  return {
    x: (pos.x / 100) * MAP_W,
    y: (pos.y / 100) * MAP_H,
  };
}

/**
 * Waypoints follow a clean zig-zag Odyssey voyage across the Aegean/Mediterranean:
 * I (Circe) → arc north → II (Realms) → north-east sea → III (Protocols)
 * → diagonal zig-zag south-west through central strait → IV (Legions / Scylla)
 * → sweep through wide southern sea waters → V (Ithaca)
 */
function getRouteWaypoints() {
  const [i, ii, iii, iv, v] = SYMBOL_ORDER.map(pinPoint);
  return [
    i,
    { x: 300, y: 195 },
    ii,
    { x: 590, y: 185 },
    iii,
    { x: 610, y: 295 },
    { x: 480, y: 340 },
    iv,
    { x: 470, y: 505 },
    { x: 620, y: 515 },
    { x: 725, y: 475 },
    v,
  ];
}

/** Smooth quadratic chain through waypoints */
export function buildMasterRouteD() {
  const pts = getRouteWaypoints();
  if (pts.length < 2) return '';

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i += 1) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cx = (prev.x + curr.x) / 2;
    const cy = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
    if (i === pts.length - 1) {
      d += ` T ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
  }
  return d;
}

let cachedPinLengths = null;

function computePinLengths(pathEl) {
  const total = pathEl.getTotalLength?.() || 0;
  if (!total || total <= 0) return null;

  const pins = SYMBOL_ORDER.map(pinPoint);
  const lengths = [0]; // Step 1: 0 length (no line drawn ahead of node 1 at start)

  let searchStart = 0;
  for (let p = 1; p < pins.length - 1; p++) {
    const pin = pins[p];
    let bestDist = Infinity;
    let bestLen = searchStart;
    for (let s = searchStart; s <= total; s += 2) {
      const pt = pathEl.getPointAtLength(s);
      const d2 = (pt.x - pin.x) ** 2 + (pt.y - pin.y) ** 2;
      if (d2 < bestDist) {
        bestDist = d2;
        bestLen = s;
      }
    }
    lengths.push(bestLen);
    searchStart = bestLen;
  }
  lengths.push(total); // Step 5: full road to node 5
  return lengths;
}

/** Reveal road path forward as user unlocks each node (1–5) */
export function updateTrailProgress(unlockedStep) {
  const roadGroup = document.getElementById('road-path-group');
  if (roadGroup) {
    roadGroup.setAttribute('data-unlocked-step', unlockedStep);
    roadGroup.classList.toggle('active', unlockedStep > 0);
  }

  const maskPath = document.getElementById('trail-mask-path');
  if (!maskPath) return;

  const total = maskPath.getTotalLength?.() || 0;
  if (total <= 0) return;

  if (!cachedPinLengths) {
    cachedPinLengths = computePinLengths(maskPath);
  }
  if (!cachedPinLengths) return;

  const step = Math.max(1, Math.min(5, unlockedStep || 1));
  const targetLen = cachedPinLengths[step - 1] || 0;

  // On first initialization, apply offset immediately without animation
  if (!maskPath.dataset.initialized) {
    maskPath.dataset.initialized = 'true';
    maskPath.style.transition = 'none';
    maskPath.style.strokeDasharray = `${total} ${total}`;
    maskPath.style.strokeDashoffset = `${total - targetLen}`;
    void maskPath.getBoundingClientRect();
    maskPath.style.transition = '';
    return;
  }

  maskPath.style.strokeDasharray = `${total} ${total}`;
  maskPath.style.strokeDashoffset = `${total - targetLen}`;
}

export class OdysseyMap {
  constructor(containerId, wrapperId, onSymbolSelect) {
    this.container = document.getElementById(containerId);
    this.wrapper = document.getElementById(wrapperId);
    this.viewport = document.querySelector('.map-viewport-area');
    this.frame = document.getElementById('map-fit-frame');
    this.video = document.getElementById('map-bg-video');
    this.onSymbolSelect = onSymbolSelect;
    this.panX = 0;
    this.panY = 0;
    this.init();
  }

  init() {
    if (!this.container || !this.wrapper) return;

    this.syncPinPositions();
    this.syncTrailPaths();
    this.ensureMapVideoPlaying();
    this.initPanDrag();

    document.querySelectorAll('.map-pin').forEach((pin) => {
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        audioSystem.playClick();
        const symbolId = pin.getAttribute('data-symbol');
        if (symbolId) {
          this.centerOnSymbol(symbolId);
          if (this.onSymbolSelect) {
            this.onSymbolSelect(symbolId);
          }
        }
      });
    });

    window.addEventListener('resize', () => this.refreshLayout());
    this.refreshLayout();

    setTimeout(() => {
      this.centerOnSymbol('voyage', false);
    }, 150);
  }

  ensureMapVideoPlaying() {
    if (!this.video) return;
    this.video.muted = true;
    const play = () => {
      this.video.play().catch(() => {});
    };
    play();
    this.video.addEventListener('loadeddata', play, { once: true });
  }

  syncPinPositions() {
    Object.entries(SYMBOLS_DATA).forEach(([id, data]) => {
      const pin = document.getElementById(`pin-${id}`);
      if (pin && data.mapPos) {
        pin.style.left = `${data.mapPos.x}%`;
        pin.style.top = `${data.mapPos.y}%`;
      }
    });
  }

  syncTrailPaths() {
    const d = buildMasterRouteD();
    const trailIds = ['trail-mask-path', 'trail-road-dots', 'trail-master'];
    trailIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('d', d);
    });
    cachedPinLengths = null;
  }

  initPanDrag() {
    const area = this.viewport || this.frame;
    if (!area || !this.frame) return;

    let startX = 0;
    let startY = 0;
    let initialPanX = 0;
    let initialPanY = 0;
    let pointerDown = false;

    const onPointerDown = (e) => {
      if (e.target.closest('button, a, .pin-badge, .pin-click-label')) return;
      pointerDown = true;
      startX = e.clientX;
      startY = e.clientY;
      initialPanX = this.panX;
      initialPanY = this.panY;
      if (this.frame) this.frame.style.transition = 'none';
      if (area.setPointerCapture && e.pointerId != null) {
        try { area.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };

    const onPointerMove = (e) => {
      if (!pointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.panX = this.clampPanX(initialPanX + dx);
      this.panY = this.clampPanY(initialPanY + dy);
      this.applyTransform();
    };

    const onPointerUp = (e) => {
      if (!pointerDown) return;
      pointerDown = false;
      if (this.frame) {
        this.frame.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.3, 1)';
      }
      this.applyTransform();
    };

    area.addEventListener('pointerdown', onPointerDown);
    area.addEventListener('pointermove', onPointerMove);
    area.addEventListener('pointerup', onPointerUp);
    area.addEventListener('pointercancel', onPointerUp);
  }

  clampPanX(val) {
    const viewW = this.viewport?.clientWidth || window.innerWidth;
    const frameW = this.frame?.clientWidth || 0;
    if (frameW <= viewW) return (viewW - frameW) / 2;
    const minX = viewW - frameW;
    const maxX = 0;
    return Math.max(minX, Math.min(maxX, val));
  }

  clampPanY(val) {
    const viewH = this.viewport?.clientHeight || 400;
    const frameH = this.frame?.clientHeight || 0;
    if (frameH <= viewH) return (viewH - frameH) / 2;
    const minY = viewH - frameH;
    const maxY = 0;
    return Math.max(minY, Math.min(maxY, val));
  }

  centerOnSymbol(symbolId, smooth = true) {
    const pos = SYMBOLS_DATA[symbolId]?.mapPos;
    if (!pos || !this.viewport || !this.frame) return;

    const viewW = this.viewport.clientWidth;
    const frameW = this.frame.clientWidth;
    const viewH = this.viewport.clientHeight;
    const frameH = this.frame.clientHeight;

    const pinPixelX = (pos.x / 100) * frameW;
    const pinPixelY = (pos.y / 100) * frameH;

    const targetX = (viewW / 2) - pinPixelX;
    const targetY = (viewH / 2) - pinPixelY;

    this.panX = this.clampPanX(targetX);
    this.panY = this.clampPanY(targetY);

    if (smooth && this.frame) {
      this.frame.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.3, 1)';
    } else if (this.frame) {
      this.frame.style.transition = 'none';
    }
    this.applyTransform();
  }

  applyTransform() {
    if (!this.frame) return;
    this.frame.style.transform = `translate3d(${Math.round(this.panX)}px, ${Math.round(this.panY)}px, 0)`;
  }

  refreshLayout() {
    this.syncTrailPaths();
    this.ensureMapVideoPlaying();
    const app = window.__odysseyApp;
    const currentSymbol = app?.symbolOrder?.[(app.sidebarPreviewStep || 1) - 1] || 'voyage';
    requestAnimationFrame(() => {
      this.centerOnSymbol(currentSymbol, false);
      if (app?.unlockedStep != null) {
        updateTrailProgress(app.unlockedStep);
      }
    });
  }

  resetView() {
    this.centerOnSymbol('voyage', true);
  }
}
