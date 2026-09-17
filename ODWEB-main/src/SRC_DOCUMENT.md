# Source Documentation (`src/`) — Interactive Odyssey Map Website

## Overview
This document provides a comprehensive technical overview and architecture guide for **The Odyssey — Journey to Innovation** interactive website located in `e:/odyssey web`.

---

## Directory & File Structure

```
odyssey web/
├── index.html                # Main SPA entry point & viewport template
├── package.json              # Project dependencies & Vite build configuration
├── images/                   # Root static image assets
├── public/
│   └── images/               # Public image assets served at /images/*
└── src/
    ├── SRC_DOCUMENT.md       # Architecture & source documentation (this file)
    ├── images/               # Source artwork & asset backup
    ├── scripts/              # Application logic & interactive controllers
    │   ├── app.js            # Main SPA Controller & serial unlocking state engine
    │   ├── map.js            # Map Pan/Zoom & SVG foot path trail renderer
    │   ├── data.js           # Lore dataset, challenges, artifacts & realm stats
    │   └── audio.js          # Web Audio API sound effect generator
    └── styles/               # CSS Design system & component styling
        ├── main.css          # Theme variables, typography & layout foundation
        ├── map.css           # Parchment map, emblem pins & SVG trail animations
        └── page.css          # Sub-page views, tab bar, lore grid & quiz styling
```

---

## Technical Component Breakdown

### 1. `src/scripts/app.js` (Main Controller)
- **Role**: Orchestrates the entire application lifecycle.
- **Key Responsibilities**:
  - **Serial Unlocking Engine**: Tracks `unlockedStep` (Steps 1 through 5). Clicking Emblem I unlocks Emblem II and reveals the brown foot path trail connecting them.
  - **View Switcher**: Smoothly transitions between the main Map View (`#map-view`) and Sub-Page View (`#page-view`).
  - **Tab Routing**: Manages internal tab switching (`lore`, `artifacts`, `challenge`) for each realm.
  - **Interactive Realm Challenges**: Handles quiz submissions, answer validation, and feedback state (`success`/`failure`).
  - **Legion Registration**: Captures team name inscriptions and triggers Odysseus & Poseidon celebration overlays.

### 2. `src/scripts/map.js` (Interactive Map Engine)
- **Role**: Manages the hand-drawn historical parchment map interface.
- **Key Responsibilities**:
  - **Pan & Zoom**: Interactive map positioning via mouse drag and touch input.
  - **Emblem Pins**: Renders pins (`pin-theme-*`) with Roman numeral badges (`I` to `V`), glowing aura rings, and coordinate tooltips.
  - **SVG Trail Rendering**: Animates progressive SVG brown foot path segments (`#trail-seg-1` to `#trail-seg-4`) as realms are visited.

### 3. `src/scripts/data.js` (Odyssey Knowledge Base)
- **Role**: Structured dataset containing all mythological and technical content.
- **Contains**:
  - **5 Key Realms**:
    1. **Symbol I — The Voyage** (Inception & Discovery)
    2. **Symbol II — Ancient Realms** (Architecture & Foundations)
    3. **Symbol III — Sacred Protocols** (Rules, Governance & Security)
    4. **Symbol IV — The Legions** (Community & Hackathon Vanguard)
    5. **Symbol V — The Final Odyssey** (Conclusion & Registration)
  - **Artifact Vault Data**: Detailed specs for mythic relics (Golden Fleece, Shield of Achilles, Corinthian Helmet, Midas Touch, Promethean Fire).
  - **Realm Quiz Questions**: Multiple choice questions to test hackathon participants.

### 4. `src/scripts/audio.js` (Mythic Soundscape Engine)
- **Role**: Generates synthesized audio effects using browser-native Web Audio API (no external MP3/WAV dependencies required).
- **Features**: Synthesizes custom audio cues for button clicks, pin unlocks, tab navigation, and challenge outcomes.

---

## Styling & Design System (`src/styles/`)

- **Color Palette**: Classical Parchment Gold (`#f39c12`), Deep Aegean Sea Dark (`#0a0705`), Imperial Bronze (`#8e5a2b`), and Gold Glow accents (`#ffd700`).
- **Typography**: Google Fonts integration using `Cinzel Decorative`, `Cinzel`, `Cormorant Garamond`, `MedievalSharp`, and `Marcellus`.
- **Animations**: CSS transitions for tab fades, emblem pulsing rings, and SVG path stroke-dashoffset animations.

---

## How to Run & Build

1. **Development Server (Vite)**:
   ```bash
   npm install
   npm run dev
   ```
2. **Production Build**:
   ```bash
   npm run build
   ```
3. **Direct Local Viewing**: Open `index.html` directly in any modern browser.
