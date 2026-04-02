# CLAUDE.md — Artemis Mission Dashboard

## Project Overview

**Name:** Artemis Mission Dashboard  
**Type:** Pure frontend React SPA — no server, no backend, no build-time secrets  
**Goal:** A futuristic, high-performance real-time dashboard for tracking space missions (Artemis II and future targets), built with a multi-agent workflow managed by Claude Code.

The app consumes only public APIs directly from the browser. All data is fetched at runtime. There are no SSR, Edge Functions, or serverless components.

---

## Multi-Agent Workflow

This project is built using **7 specialized Claude Code sub-agents** coordinated by the Architect. Each agent owns a specific domain. The Architect must be consulted before any cross-domain decision.

When Claude Code runs this project, it must:
1. Spawn agents in dependency order (Architecture → Data → React → UI/UX + 3D + Charts → Performance)
2. Each agent reads the relevant section of this file before starting work
3. No agent modifies another agent's files without explicit Architect approval
4. Performance agent runs last as a review/audit pass

---

## Agent Definitions

---

### AGENT 1 — Architect (Coordinator)
**Role:** Master coordinator. Makes all structural decisions. Defines and enforces boundaries between agents. Resolves conflicts. No implementation work — only design, review, and coordination.

**Responsibilities:**
- Define folder structure and module boundaries
- Assign tasks to sub-agents with precise scopes
- Review integration points between agents
- Ensure no agent introduces unnecessary complexity or coupling
- Gate any library addition (must be justified with bundle cost)

**Authority:**
- Can reject any implementation from any agent
- Final say on state management patterns, data flow, and component hierarchy
- Approves the target configuration schema before Data Agent implements it

**Output:** `ARCHITECTURE.md` (living document updated throughout build)

---

### AGENT 2 — Data & Telemetry Agent
**Role:** Expert in space mission data sources, API integration, and the target configuration system.

**Responsibilities:**
- Implement the `MissionTarget` configuration system (see Target System section)
- Write all data-fetching hooks (`useHorizons`, `useSpaceWeather`, `useNasaImages`, `useMissionBlog`)
- Define normalized data types used across the app (`SpacecraftState`, `SolarWindSample`, etc.)
- Handle polling, caching (in-memory, no localStorage), error states, and CORS fallbacks
- Document which APIs are live vs. simulated for each target

**Must NOT:**
- Touch React component rendering
- Import any UI library
- Access or modify Three.js or chart code

**Output:** `src/data/` directory — all hooks, types, adapters, and target configs

---

### AGENT 3 — React Architecture Agent
**Role:** Expert in React patterns, state management, and component design for a data-intensive SPA.

**Responsibilities:**
- Define component tree and folder structure under `src/components/`
- Implement global state (Zustand, minimal — no Redux overhead)
- Build layout shell: sidebar, header, panel grid, responsive breakpoints
- Wire data hooks to components via context or prop drilling (minimize context)
- Implement the target switcher UI (dropdown or modal)
- Manage code splitting: Three.js scene lazy-loaded, charts lazy-loaded

**Rules:**
- No inline styles — use CSS modules or Tailwind utility classes consistently
- All async states must have loading, error, and empty variants
- Components must be pure and testable — no side effects outside hooks
- Never import from `src/data/` directly in leaf components — use container components

**Output:** `src/components/`, `src/store/`, `src/layouts/`

---

### AGENT 4 — UI/UX Agent
**Role:** Expert in futuristic dashboard aesthetics, motion design, and design system coherence.

**Responsibilities:**
- Define and implement the design system: CSS custom properties, color palette, typography scale, spacing scale
- Implement the dark futuristic theme (deep space aesthetic: near-black backgrounds, cyan/amber accent palette, subtle grid overlays)
- Design and implement reusable primitives: `Panel`, `MetricCard`, `Badge`, `StatusDot`, `Divider`, `GlassCard`
- Implement ambient animations: scanline effect, pulsing status indicators, smooth number transitions (CountUp)
- Ensure accessibility: sufficient contrast, no motion for `prefers-reduced-motion`
- Define responsive layout breakpoints in coordination with React Agent

**Aesthetic references:**
- Color palette: `#0a0e1a` (bg), `#00d4ff` (primary cyan), `#ff6b35` (alert amber), `#7fff00` (safe green), `#1a1f35` (panel bg)
- Font: `Space Grotesk` (headings) + `Space Mono` (telemetry numbers) — both from Google Fonts
- Panels: thin `1px` border with low-opacity cyan, subtle `box-shadow` glow
- No skeuomorphic elements, no gradients on text, no excessive blur

**Output:** `src/styles/`, `src/components/ui/` (primitives only)

---

### AGENT 5 — 3D Scene Agent
**Role:** Expert in Three.js and WebGL optimization for embedded real-time 3D in a React app.

**Responsibilities:**
- Implement the main 3D scene: Earth, Moon, Orion spacecraft, trajectory arc, current position marker
- Integrate with `SpacecraftState` data from Data Agent (position in km from Earth center → convert to scene units)
- Implement scene controls: OrbitControls with damping, zoom limits, auto-rotate option
- Manage WebGL context lifecycle: proper dispose on unmount, no memory leaks
- Implement LOD (Level of Detail): low-poly fallback if device is low-end (detected via `navigator.hardwareConcurrency < 4`)
- Scene assets: use procedural geometry where possible (no large GLTF downloads); Earth sphere with texture from NASA's public tile server

**Performance constraints (non-negotiable):**
- Target 60fps on a mid-range laptop GPU
- Max 1 draw call for trajectory (BufferGeometry line, not Line objects)
- Earth texture: max 2048×1024, lazy-loaded after first paint
- No postprocessing by default (Bloom only if Performance Agent approves)
- Scene canvas must be a separate React subtree, isolated from main render cycle

**Coordinate system:**
- Scene unit = 1000 km
- Earth at origin, radius ≈ 6.4 units
- Moon at ~384 units (real scale compressed: use 60 units for readability, configurable)
- Spacecraft position fed from `SpacecraftState.positionKm: [x, y, z]`

**Output:** `src/scene/` — ThreeScene.tsx (lazy), hooks, utils, shaders if any

---

### AGENT 6 — Charts & Data Viz Agent
**Role:** Expert in real-time data visualization with Recharts and/or D3.

**Responsibilities:**
- Implement all 2D charts: solar wind speed/density timeseries, Kp index bar chart, distance-from-Earth/Moon area chart, mission elapsed time gauge
- All charts use live data from Data Agent hooks via props
- Charts must update smoothly: use windowed data arrays (max 60 samples in memory per series)
- Animate transitions but respect `prefers-reduced-motion`
- Implement a mini mission timeline component showing key milestones (static config per target)

**Library choice:**
- Primary: Recharts (React-native, good bundle, sufficient for this use case)
- Use D3 only for custom shapes not available in Recharts (e.g., radial gauge)
- Do NOT add both full D3 and Recharts — pick one per chart type

**Output:** `src/charts/`

---

### AGENT 7 — Performance Agent
**Role:** Expert in web performance, bundle analysis, and browser rendering optimization. Runs last as an audit agent.

**Responsibilities:**
- Audit final bundle with `vite-bundle-visualizer` and flag anything over 50kB gzipped that isn't justified
- Verify Three.js is lazy-loaded and not in the critical path
- Verify charts are lazy-loaded
- Check for memory leaks: Three.js dispose, polling `clearInterval` on unmount, AbortControllers on fetch
- Enforce requestAnimationFrame usage in 3D — no `setInterval` for animation
- Enforce polling intervals: minimum 30s for Horizons (rate limit respect), 60s for NASA Images
- Check React re-render frequency with DevTools — no component rendering >10 times/second
- Enforce no `console.log` in production build
- Add `React.memo` where profile shows unnecessary re-renders
- Validate Lighthouse score targets: Performance ≥85, Accessibility ≥90

**Output:** `PERFORMANCE_AUDIT.md` + targeted code fixes

---

## Target Configuration System

The dashboard supports multiple mission targets. Switching targets requires zero code changes — only a config change.

### `MissionTarget` schema

```typescript
// src/data/targets/types.ts

export interface MissionTarget {
  id: string;                        // e.g. "artemis-2"
  label: string;                     // e.g. "Artemis II — Orion"
  active: boolean;                   // is the mission currently live?

  spacecraft: {
    name: string;
    crew: CrewMember[];              // empty array for uncrewed
    launchDate: string;              // ISO 8601
    splashdownDate?: string;
  };

  telemetry: TelemetryConfig;
  spaceWeather: SpaceWeatherConfig;
  milestones: Milestone[];
  scene: SceneConfig;
}

export interface TelemetryConfig {
  source: "horizons" | "simulated" | "custom";

  // JPL Horizons config (when source === "horizons")
  horizons?: {
    commandId: string;               // e.g. "-1023" (SPKID)
    center: string;                  // e.g. "500@399" (geocentric)
    stepSizeMinutes: number;
  };

  // Simulated config (when source === "simulated")
  simulated?: {
    orbitRadiusKm: number;
    periodHours: number;
  };

  // Custom fetch (when source === "custom")
  custom?: {
    fetchFn: () => Promise<SpacecraftState>;
    intervalMs: number;
  };
}

export interface SpacecraftState {
  timestamp: Date;
  positionKm: [number, number, number];   // ECI J2000, km
  velocityKmS: [number, number, number];  // km/s
  distanceFromEarthKm: number;
  distanceFromMoonKm: number;
  speedKmS: number;
}

export interface Milestone {
  id: string;
  label: string;
  timestamp: string;                 // ISO 8601
  type: "launch" | "burn" | "flyby" | "splashdown" | "other";
  completed: boolean;
}

export interface SceneConfig {
  showMoon: boolean;
  trajectoryPoints: number;          // how many historical points to draw
  compressedScale: boolean;          // true = Earth-Moon distance visually compressed
  cameraInitialPosition: [number, number, number];
}
```

### Bundled targets

| Target ID | Source | Status |
|---|---|---|
| `artemis-2` | JPL Horizons `-1023` (verify) + NOAA SWPC | LIVE — April 2026 |
| `artemis-1` | JPL Horizons `-1023` historical | Historical simulation |
| `iss` | `celestrak.org` TLE → SGP4 (via `satellite.js`) | Always live |
| `voyager-1` | JPL Horizons `-31` | Always live |
| `webb` | JPL Horizons `-170` | Always live |
| `demo` | `simulated` | Offline demo, no network |

The `demo` target must work with zero network access. Use it as the default if all fetches fail.

---

## Data Sources & API Reference

### 1. JPL Horizons — spacecraft state vectors
```
GET https://ssd.jpl.nasa.gov/api/horizons.api
  ?format=json
  &COMMAND='{spkid}'
  &EPHEM_TYPE=VECTORS
  &CENTER='500@399'
  &START_TIME='{now - 1min}'
  &STOP_TIME='{now + 1min}'
  &STEP_SIZE='1m'
  &OUT_UNITS='KM-S'
  &VEC_TABLE=2
  &VEC_LABELS=NO
  &CSV_FORMAT=NO
```

- **CORS:** direct browser calls appear to work (artemislive.org does this). If blocked, fallback to `https://corsproxy.io/?` prefix.
- **Rate limit:** conservative — poll max every 60s in production
- **Response parsing:** extract `$$SOE ... $$EOE` block, parse X Y Z VX VY VZ columns

### 2. NOAA SWPC — space weather
```
# Solar wind (5-min cadence, last 2h)
GET https://services.swpc.noaa.gov/json/solar-wind/mag-5-minute.json

# Planetary K-index (1-min)
GET https://services.swpc.noaa.gov/json/planetary_k_index_1m.json

# Solar energetic particles (relevant for crew radiation)
GET https://services.swpc.noaa.gov/json/goes/primary/differential-proton-flux-1-day.json
```
- **CORS:** fully supported, no auth
- **Poll interval:** 60s is sufficient

### 3. NASA Images API — mission photos
```
GET https://images-api.nasa.gov/search
  ?q=artemis+II
  &media_type=image
  &year_start=2026
  &page_size=10
```
- **CORS:** supported
- **Poll interval:** 300s (images don't change often)

### 4. NASA Mission Blog — text updates
RSS feed not directly CORS-accessible. Use public RSS-to-JSON proxy:
```
GET https://api.rss2json.com/v1/api.json
  ?rss_url=https%3A%2F%2Fblogs.nasa.gov%2Fartemis%2Ffeed%2F
  &count=10
```
- **CORS:** proxy handles it
- **Fallback:** if proxy unavailable, skip gracefully — non-critical panel
- **Poll interval:** 120s

### 5. Celestrak TLEs — for ISS target
```
GET https://celestrak.org/SOCRATES/query.php  // for future use
GET https://celestrak.org/SPACETRACK/query/class/gp/CATNR/25544/format/json
```
Requires `satellite.js` library for SGP4 propagation. Only import if ISS target is selected (dynamic import).

---

## Tech Stack

| Layer | Library | Justification |
|---|---|---|
| Framework | React 19 + Vite | Fast HMR, native lazy imports |
| Language | TypeScript (strict) | Required across all agents |
| 3D | Three.js r168 | Direct, no React Three Fiber (reduces abstraction overhead) |
| Charts | Recharts 2.x | React-native, tree-shakeable |
| State | Zustand | Minimal API, no boilerplate |
| Styling | CSS Modules + CSS custom properties | Zero runtime cost |
| Fonts | Space Grotesk + Space Mono | Via `@fontsource` packages |
| HTTP | Native `fetch` + `AbortController` | No axios overhead |
| TLE propagation | `satellite.js` | Dynamic import, ISS target only |

**Explicitly forbidden:**
- Next.js, Remix, or any SSR framework
- Redux, MobX
- Axios
- `styled-components` or `emotion` (runtime CSS overhead)
- Any chart library with D3 as a peer dep unless actually using D3 features
- `moment.js` (use native `Intl` + `Date`)
- `lodash` (use native JS)

---

## Folder Structure

```
artemis-dashboard/
├── CLAUDE.md                    # this file
├── ARCHITECTURE.md              # maintained by Architect Agent
├── PERFORMANCE_AUDIT.md         # maintained by Performance Agent
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   └── textures/                # earth_2k.jpg, moon_2k.jpg (committed)
│
└── src/
    ├── main.tsx
    ├── App.tsx                  # root: target provider + layout shell
    │
    ├── data/                    # DATA AGENT domain
    │   ├── targets/
    │   │   ├── types.ts
    │   │   ├── artemis-2.ts
    │   │   ├── artemis-1.ts
    │   │   ├── iss.ts
    │   │   ├── voyager-1.ts
    │   │   ├── webb.ts
    │   │   └── demo.ts
    │   ├── hooks/
    │   │   ├── useHorizons.ts
    │   │   ├── useSpaceWeather.ts
    │   │   ├── useNasaImages.ts
    │   │   └── useMissionBlog.ts
    │   ├── adapters/
    │   │   ├── horizons.ts      # raw response → SpacecraftState
    │   │   ├── noaa.ts          # raw → SolarWindSample[]
    │   │   └── rss.ts           # raw → BlogPost[]
    │   └── utils/
    │       ├── cors.ts          # CORS proxy fallback logic
    │       └── polling.ts       # generic polling hook factory
    │
    ├── store/                   # REACT AGENT domain
    │   ├── useTargetStore.ts    # active target, switch action
    │   └── useDashboardStore.ts # panel visibility, UI prefs
    │
    ├── layouts/                 # REACT AGENT domain
    │   ├── DashboardLayout.tsx
    │   ├── Sidebar.tsx
    │   └── PanelGrid.tsx
    │
    ├── components/              # REACT AGENT domain
    │   ├── ui/                  # UI/UX AGENT primitives
    │   │   ├── Panel.tsx
    │   │   ├── MetricCard.tsx
    │   │   ├── StatusDot.tsx
    │   │   ├── Badge.tsx
    │   │   └── GlassCard.tsx
    │   ├── telemetry/
    │   │   ├── PositionMetrics.tsx
    │   │   ├── VelocityReadout.tsx
    │   │   └── MissionTimer.tsx
    │   ├── mission/
    │   │   ├── TargetSwitcher.tsx
    │   │   ├── MilestoneTimeline.tsx
    │   │   └── CrewCard.tsx
    │   ├── media/
    │   │   ├── ImageFeed.tsx
    │   │   └── BlogFeed.tsx
    │   └── weather/
    │       └── SpaceWeatherPanel.tsx
    │
    ├── scene/                   # 3D AGENT domain (lazy-loaded)
    │   ├── ThreeScene.tsx       # lazy boundary
    │   ├── SceneCore.ts         # Three.js init, resize, dispose
    │   ├── objects/
    │   │   ├── Earth.ts
    │   │   ├── Moon.ts
    │   │   ├── Spacecraft.ts
    │   │   └── Trajectory.ts
    │   └── utils/
    │       ├── coordinates.ts   # ECI → scene units conversion
    │       └── lod.ts           # device capability detection
    │
    ├── charts/                  # CHARTS AGENT domain (lazy-loaded)
    │   ├── SolarWindChart.tsx
    │   ├── KpIndexChart.tsx
    │   ├── DistanceChart.tsx
    │   └── MissionGauge.tsx
    │
    └── styles/                  # UI/UX AGENT domain
        ├── globals.css
        ├── tokens.css           # all CSS custom properties
        ├── typography.css
        └── animations.css
```

---

## Performance Budget

| Asset | Budget |
|---|---|
| Initial JS bundle (gzipped) | ≤150kB |
| Three.js chunk (lazy) | ≤280kB gzipped |
| Recharts chunk (lazy) | ≤80kB gzipped |
| Earth texture | ≤800kB (loaded after first paint) |
| Total network on first load | ≤500kB |
| Time to Interactive (mid laptop) | ≤2.5s |
| Target frame rate (3D scene) | 60fps |
| Max polling requests/min | ≤6 total across all sources |

---

## Implementation Order for Claude Code

Run agents in this sequence. Each agent works only within its domain folder.

```
1. Architect      → ARCHITECTURE.md + folder scaffold + tsconfig + vite.config
2. Data Agent     → src/data/ (types first, then hooks, then targets)
3. React Agent    → src/store/ + src/layouts/ + src/components/ (wiring only, no styling)
4. UI/UX Agent    → src/styles/ + src/components/ui/ + theming
5. 3D Agent       → src/scene/ (lazy-loaded, isolated)
6. Charts Agent   → src/charts/ (lazy-loaded, isolated)
7. Performance    → audit + targeted fixes across all domains
```

**Parallelizable:** Steps 4, 5, and 6 can run in parallel once Step 3 is complete.

---

## Key Constraints Summary

- **No server.** No API routes, no serverless functions, no proxies owned by us.
- **No auth.** All APIs used are public and unauthenticated.
- **No persistence.** No localStorage, no IndexedDB. State resets on refresh.
- **CORS fallback strategy:** try direct → try `corsproxy.io` → serve stale data or degrade panel gracefully.
- **Offline fallback:** if all fetches fail, auto-switch to `demo` target.
- **All polling uses `AbortController`.** No fetch outlives its component.
- **All Three.js resources call `.dispose()` on unmount.** No WebGL context leaks.
- **No hardcoded mission data.** Everything comes from target config or live API.

---

## Validation Checklist (before marking complete)

- [ ] Target switcher works: switching from `artemis-2` to `voyager-1` to `demo` with no crash
- [ ] All panels show loading state before first data arrives
- [ ] All panels show error state if fetch fails (no silent empty panels)
- [ ] 3D scene loads lazily (not in initial bundle)
- [ ] Memory stable over 10 minutes (no growing heap)
- [ ] `prefers-reduced-motion` disables all CSS animations
- [ ] Works on Firefox, Chrome, Safari (WebGL required — show graceful fallback if unavailable)
- [ ] Lighthouse Performance ≥85
- [ ] No `console.log` in production
- [ ] TypeScript strict mode: zero errors
