# Artemis II Live Tracker -- Competitive Feature Analysis

**Date:** 2026-04-02
**Purpose:** Drive OrionWatch redesign with comprehensive competitive intelligence
**Sites Analyzed:** 8 trackers + NASA official AROW

---

## 1. Sites Surveyed

| # | Site | Type | Tech | Status |
|---|------|------|------|--------|
| 1 | **NASA AROW** (nasa.gov) | Official | Unity 3D (desktop), mobile AR | Live, authoritative |
| 2 | **artemislivetracker.com** | Independent | Canvas 2D, vanilla JS | Live, best-in-class indie |
| 3 | **artemislive.org** | Independent | Unity 3D, JPL data | Live (403 at time of fetch) |
| 4 | **jasperbernaers.com/artemis-ii-tracker** | Independent | Next.js, React | Live, data-heavy |
| 5 | **artemis-live-dashboard.vercel.app** | Independent | React, modular cards | Live, expandable UI |
| 6 | **artemistracker.com/watch-live** | Independent | CSS animations, static data | Live, launch-focused |
| 7 | **jameswebbtracker.com/artemis-ii** | Independent | Static + JS countdown | Live, educational |
| 8 | **artemis2.live** | Independent | Static hero + countdown | Minimal, commercial angle |

---

## 2. Feature Inventory Matrix

### 2.1 Telemetry Metrics

| Metric | AROW | artemislivetracker | jasperbernaers | vercel-dashboard | artemistracker | jameswebbtracker | OrionWatch (current) |
|--------|:----:|:-------------------:|:--------------:|:----------------:|:--------------:|:----------------:|:-------------------:|
| Mission Elapsed Time | Y | Y | Y | Y | Y | Y | Y |
| Distance from Earth | Y | Y | Y | Y | -- | Y | Y |
| Distance from Moon | Y | Y | Y | Y | -- | -- | Y |
| Spacecraft Velocity | Y | Y | -- | Y | -- | -- | Y |
| Velocity as Mach number | -- | **Y** | -- | -- | -- | -- | -- |
| Altitude above Earth | -- | **Y** | -- | -- | -- | -- | -- |
| Hull Temperature (sunlit) | -- | **Y** | -- | -- | -- | -- | -- |
| Hull Temperature (shadow) | -- | **Y** | -- | -- | -- | -- | -- |
| Cabin Temperature | -- | **Y** | -- | -- | -- | -- | -- |
| Heatshield Temperature | -- | **Y** | -- | -- | -- | -- | -- |
| G-Force on Crew | -- | **Y** | -- | -- | -- | -- | -- |
| Signal Delay (one-way) | -- | **Y** | -- | -- | -- | -- | -- |
| Mission Progress % | -- | **Y** | -- | -- | -- | -- | -- |
| Cumulative Path Distance | -- | **Y** | -- | -- | -- | -- | -- |
| Current Flight Phase | -- | **Y** | -- | Y | -- | -- | -- |
| Orbital Speed (km/s) | -- | -- | -- | Y | -- | -- | -- |
| Re-entry Velocity | -- | Y | -- | -- | -- | Y | -- |
| Crew Radiation Risk | -- | -- | -- | **Y** | -- | -- | -- |
| Solar Wind Speed | -- | -- | Y | Y | -- | -- | Y |
| Kp Index | -- | -- | Y | Y | -- | -- | Y |
| Solar X-ray Flux | -- | -- | -- | **Y** | -- | -- | -- |
| Unit Toggle (MI/KM) | -- | -- | -- | **Y** | -- | -- | -- |

**Key finding:** artemislivetracker.com has the most comprehensive telemetry by far (14 unique metrics). The Vercel dashboard leads on space weather integration. Most sites only show the basic 4 (time, distance Earth, distance Moon, speed).

### 2.2 3D / Visualization

| Feature | AROW | artemislivetracker | artemislive.org | jasperbernaers | vercel-dashboard | artemistracker |
|---------|:----:|:-------------------:|:---------------:|:--------------:|:----------------:|:--------------:|
| True 3D scene | **Y** (Unity) | -- (2D canvas) | **Y** (Unity) | -- | -- | -- |
| 2D trajectory canvas | -- | **Y** | -- | **Y** | -- | **Y** (CSS anim) |
| Earth rendered | Y | Y (Blue Marble photo) | Y | Y | -- | -- |
| Moon rendered | Y | Y (USGS photo) | Y | Y | -- | -- |
| Spacecraft model | Y | Y (detailed 2D w/ solar panels) | Y | -- | -- | -- |
| Trajectory line (flown) | Y | Y (green glow) | Y | Y (gradient) | -- | Y (CSS stroke) |
| Trajectory line (planned) | Y | Y | Y | Y | -- | -- |
| Distance range rings | -- | **Y** (60k, 150k, 280k, 384k km) | -- | -- | -- | -- |
| Grid overlay | -- | **Y** | -- | -- | -- | -- |
| Apollo 13 record circle | -- | **Y** (dashed orange @ 400,171km) | -- | -- | -- | -- |
| Milestone labels on map | -- | **Y** (TLI, closest approach, KSC) | -- | Y | -- | -- |
| Camera from spacecraft | **Y** | -- | **Y** | -- | -- | -- |
| Multiple camera angles | **Y** | -- | **Y** | -- | -- | -- |
| Zoom/Pan controls | Y | **Y** (wheel, drag, pinch) | Y | -- | -- | -- |
| "Locate Craft" button | -- | **Y** | -- | -- | -- | -- |
| Starfield background | -- | **Y** (180 stars, twinkle) | Y | Y | -- | -- |
| Animated comets | -- | **Y** (5 particle trails) | -- | -- | -- | -- |
| Connection lines to bodies | -- | **Y** (dashed blue to Earth) | -- | -- | -- | -- |
| Atmospheric glow on Earth | -- | **Y** | Y | -- | -- | -- |
| AR tracker (mobile) | **Y** | -- | -- | -- | -- | -- |

**Key finding:** NASA AROW and artemislive.org use Unity 3D with multi-camera views. artemislivetracker.com achieves the best 2D canvas visualization with rich contextual overlays (range rings, record markers, grid). No indie site has true WebGL 3D with Three.js -- this is our differentiator opportunity.

### 2.3 Mission Timeline

| Feature | artemislivetracker | jasperbernaers | vercel-dashboard | artemistracker | jameswebbtracker |
|---------|:-------------------:|:--------------:|:----------------:|:--------------:|:----------------:|
| Phase list | 21 events | 10 phases | Phase filter tabs | 6 phases | 6 phases |
| Done/Active/Upcoming states | **Y** (green/cyan/gray dots) | Y (dots + progress) | -- | Y (progressive activation) | -- |
| ETA countdown per event | **Y** | -- | -- | -- | -- |
| Phase description text | Y | Y | -- | Y | Y |
| Duration per phase | Y (hours from T+0) | Y (day labels) | -- | -- | -- |
| Historic record markers | **Y** (star icon at 400,171km) | -- | -- | -- | -- |
| Scrollable timeline panel | **Y** | -- | -- | -- | -- |
| Filter by category | -- | -- | **Y** (ASCENT/ORBIT/TLI/LUNAR/RETURN) | -- | -- |

**Key finding:** artemislivetracker has the gold standard timeline (21 events, ETA per event, historic record markers). The Vercel dashboard's phase filtering is a good UX pattern we should adopt.

### 2.4 Crew Display

| Feature | artemislivetracker | jasperbernaers | vercel-dashboard | artemistracker | jameswebbtracker |
|---------|:-------------------:|:--------------:|:----------------:|:--------------:|:----------------:|
| Photo portraits | -- (initials only) | -- | Y | **Y** (NASA photos) | **Y** |
| Name + role | Y | Y | Y | Y | Y |
| Country flag | Y (emoji) | -- | Y (emoji) | -- | Y |
| Social media links | **Y** (Instagram) | -- | -- | **Y** (X/Twitter) | -- |
| Bio/achievements | -- | -- | -- | **Y** (detailed) | **Y** |
| "Historic firsts" badges | -- | -- | -- | -- | **Y** |
| Backup crew listed | -- | -- | **Y** | -- | -- |
| Carousel navigation | -- | **Y** (5-photo carousel) | -- | -- | -- |

**Key finding:** jameswebbtracker and artemistracker have the best crew sections with photos, bios, and historic firsts. artemislivetracker's initials-only approach is a notable weakness. Including backup crew (Vercel) is a nice differentiator.

### 2.5 Space Weather

| Feature | jasperbernaers | vercel-dashboard | artemislivetracker (implied) |
|---------|:--------------:|:----------------:|:----------------------------:|
| Solar wind mag data | Y (NOAA) | Y | -- |
| Kp index | Y | Y | -- |
| Solar X-ray flux | -- | **Y** | -- |
| Crew radiation risk | -- | **Y** | -- |
| Solar flare alerts | Y (NASA DONKI) | -- | -- |
| CME tracking | Y (NASA DONKI) | -- | -- |
| Proton flux | -- | Y (referenced) | -- |
| Auto-refresh timer shown | -- | **Y** (5-min display) | -- |

**Key finding:** The Vercel dashboard uniquely ties space weather to crew safety (radiation risk). jasperbernaers integrates NASA DONKI for solar events. This "crew safety" framing is compelling and unique.

### 2.6 Additional Features

| Feature | Site(s) |
|---------|---------|
| Multi-language support (10 langs) | jasperbernaers |
| Light/dark theme toggle | jasperbernaers |
| Objectives checklist (localStorage) | jasperbernaers |
| News aggregation (8 RSS sources) | jasperbernaers |
| NASA APOD integration | jasperbernaers |
| DSN connectivity status | vercel-dashboard |
| Service worker / offline | vercel-dashboard |
| Expandable/collapsible panels | vercel-dashboard |
| Reset layout button | vercel-dashboard |
| Scanline CRT overlay | jasperbernaers |
| Radial vignette | jasperbernaers |
| Marketplace / collectibles | artemis2.live |
| Moon education section | jameswebbtracker |
| AVATAR science experiment info | jameswebbtracker |
| Downloadable state vectors | NASA AROW |
| CSS stroke-dasharray orbit animation | artemistracker |

---

## 3. Best Practices Identified

### 3.1 Information Architecture
- **Hierarchical disclosure**: The Vercel dashboard's expandable cards let users control complexity. This is the right pattern for data-dense dashboards.
- **Phase-aware UI**: artemislivetracker changes what metrics are highlighted based on mission phase (e.g., heatshield temp becomes prominent during reentry). This is context-sensitive and excellent.
- **Spatial + Temporal dual view**: The best sites pair a trajectory visualization (spatial) with a timeline (temporal). Both views are essential.

### 3.2 Data Presentation
- **Progress bars on distance metrics**: artemislivetracker uses mini progress bars next to distance values, giving instant visual sense of "how far along."
- **Unit toggles**: The Vercel dashboard's MI/KM toggle is essential for international audience.
- **Color-coded temperatures**: artemislivetracker color-codes heatshield readings (blue/orange/red) based on severity thresholds.
- **Derived metrics matter**: Signal delay, Mach number, and cumulative path distance are all trivially computed from base telemetry but feel "premium."

### 3.3 Visual Design
- **Near-black backgrounds** are universal (range: #020408 to #0a0e1a). No site uses a light default.
- **Cyan is the dominant accent** across all sites. Secondary accents vary: amber/coral (artemislivetracker), gold (artemistracker, jameswebbtracker), green (jasperbernaers).
- **Monospace fonts for telemetry** are universal: JetBrains Mono, Share Tech Mono, Orbitron, DM Mono.
- **Letter-spacing on labels** creates the "mission control" feel -- 1-3px spacing on uppercase labels.
- **Scanline overlays** appear on 2 sites and create strong atmospheric effect.

### 3.4 Performance & Reliability
- **CORS proxy fallbacks** are standard (corsproxy.io, rss2json).
- **AbortSignal timeouts** (6-10s) prevent hanging requests.
- **Graceful degradation**: jasperbernaers shows fallback links when API calls fail.
- **No site uses Three.js** -- they use Unity (AROW, artemislive.org) or 2D Canvas. This is significant.

---

## 4. Unique Differentiators We Should Adopt

### MUST HAVE (High impact, proven by competitors)

1. **Derived telemetry metrics** -- Signal delay, Mach number, G-force, cumulative distance are all cheap to compute and dramatically increase perceived data richness. artemislivetracker proves users want these.

2. **Phase-aware dynamic UI** -- Highlight different metrics based on current flight phase. During TLI: show delta-V and burn progress. During coast: show distance records. During reentry: show heatshield temp and G-force.

3. **Range rings on trajectory view** -- artemislivetracker's distance rings (60k, 150k, 280k, 384k km) with the Apollo 13 record marker give essential spatial context to the 3D scene.

4. **"Locate Craft" button** -- One-click camera animation to frame Earth-Moon-Orion. Essential for users who get lost in 3D space.

5. **Mission timeline with ETA per event** -- Not just "done/upcoming" but "ETA: 14h 32m" for each milestone. Creates urgency and engagement.

6. **Unit toggle (MI/KM)** -- International audience demands this.

7. **Crew radiation risk indicator** -- Ties space weather data to human impact. Unique to Vercel dashboard but compelling framing.

### SHOULD HAVE (Strong differentiators)

8. **Historic records tracking** -- "HUMAN DISTANCE RECORD" marker at 400,171km (Apollo 13) that unlocks when Artemis II surpasses it. Gamification without being gimmicky.

9. **Temperature telemetry suite** -- Hull sunlit/shadow, cabin, heatshield, radiator. These are simulated but add enormous perceived depth.

10. **Expandable/collapsible panels** -- Let users customize information density.

11. **Deep Space Network status** -- Show DSN antenna connectivity. Real data available from NASA DSN Now API.

12. **Backup crew section** -- Only Vercel dashboard does this. Easy win.

### NICE TO HAVE (Polish features)

13. **Scanline CRT overlay** -- Subtle, toggleable, atmospheric.
14. **Animated comets in 3D scene** -- Particle effects add life.
15. **Multi-language support** -- jasperbernaers supports 10 languages.

---

## 5. Gaps and Weaknesses We Can Exploit

### 5.1 No Competitor Has True WebGL 3D with Three.js

This is the single biggest opportunity. The landscape is:
- **AROW/artemislive.org**: Unity 3D (heavy, not embeddable, no source customization)
- **artemislivetracker**: 2D Canvas (beautiful but flat -- no orbit inclination, no depth perception)
- **Everyone else**: No visualization or CSS animations only

OrionWatch with Three.js can deliver:
- True 3D orbital mechanics with proper inclination
- Textured Earth/Moon spheres with atmospheric shaders
- Smooth OrbitControls with damping
- LOD for mobile
- Real depth perception of the trajectory

This is our **primary differentiator**.

### 5.2 No Competitor Integrates All Data Sources

| Site | Horizons | NOAA SWPC | NASA Images | Blog/RSS | DSN |
|------|:--------:|:---------:|:-----------:|:--------:|:---:|
| artemislivetracker | Simulated | -- | -- | -- | -- |
| jasperbernaers | Partial | Y | -- | Y (8 feeds) | -- |
| vercel-dashboard | Y (JPL) | Y | -- | Y | Partial |
| **OrionWatch target** | **Y** | **Y** | **Y** | **Y** | **(add)** |

We can be the only site that integrates ALL five data sources in one dashboard.

### 5.3 No Competitor Has Smooth Real-Time Chart Updates

Nobody does live-updating Recharts/D3 timeseries for solar wind, Kp index, or distance over time. They show static values or simple gauges. Animated, windowed timeseries charts are a significant visual upgrade.

### 5.4 Crew Sections Are Universally Weak

Even the best (jameswebbtracker) only shows static photos and text bios. Nobody has:
- Real-time crew activity status (sleeping/working/EVA)
- Current crew task from mission timeline
- Health metrics context (beyond radiation risk)

### 5.5 Mobile 3D Is Unsolved

artemislivetracker drops the map entirely on mobile. AROW uses a separate mobile app. Nobody has responsive 3D that works on phone browsers. Even a simplified 2D fallback with the trajectory arc would beat the competition.

### 5.6 No Site Supports Multiple Mission Targets

Every site is hardcoded to Artemis II. Our target switching system (Artemis II, Artemis I, ISS, Voyager, Webb, demo) is completely unique in the landscape.

### 5.7 Accessibility Is Universally Poor

- artemislivetracker uses 7px fonts
- No site has keyboard navigation for 3D
- `prefers-reduced-motion` is ignored by most
- Color contrast on dark themes is often insufficient

---

## 6. Recommended Improvements for OrionWatch

### Priority 1 -- Core Differentiation (implement first)

| # | Improvement | Justification |
|---|-------------|---------------|
| 1 | **Add derived metrics panel**: Signal delay, Mach number, G-force, cumulative distance, mission progress % | artemislivetracker proves these are the most engaging metrics. Cheap to compute from existing SpacecraftState. |
| 2 | **Add range rings + Apollo 13 record marker to 3D scene** | Gives spatial context. Our 3D is meaningless without scale references. |
| 3 | **Implement "Locate Craft" camera button** | Users WILL get lost in 3D space. One-click reset is essential UX. |
| 4 | **Add phase-aware metric highlighting** | Create a `getActivePhase(elapsedHours)` function that returns which metrics to emphasize. |
| 5 | **Implement MI/KM unit toggle** | Store preference in Zustand. Apply globally. |

### Priority 2 -- Data Richness

| # | Improvement | Justification |
|---|-------------|---------------|
| 6 | **Add temperature telemetry** (simulated from phase + sun angle) | 4 temperature readings dramatically increase perceived depth. Can simulate from mission phase. |
| 7 | **Add crew radiation risk indicator** | Connect Kp index + proton flux to a human-readable risk level (Low/Moderate/High). |
| 8 | **Integrate DSN Now API** | `https://eyes.nasa.gov/dsn/data/dsn.xml` -- show which antenna is tracking Orion. |
| 9 | **Add timeline ETA countdowns** | For each upcoming milestone, show "ETA: Xh Ym" updated every second. |
| 10 | **Expand crew cards**: photos, bios, historic firsts badges, backup crew | Beat every competitor's crew section. |

### Priority 3 -- Visual Polish

| # | Improvement | Justification |
|---|-------------|---------------|
| 11 | **Add atmospheric glow shader on Earth** in 3D scene | Every competitor renders Earth with a glow. Ours must too. |
| 12 | **Add animated starfield** to 3D scene background | 100-200 procedural stars with subtle twinkle. Standard across competitors. |
| 13 | **Add trajectory glow effect** | Double-render: outer glow line + inner bright line. artemislivetracker's approach. |
| 14 | **Add scanline overlay** (optional, `prefers-reduced-motion` aware) | Atmospheric effect used by 2 top competitors. |
| 15 | **Add progress bars to distance metrics** | Visual fill bars next to numeric values. Instant comprehension. |

### Priority 4 -- UX Improvements

| # | Improvement | Justification |
|---|-------------|---------------|
| 16 | **Expandable/collapsible panels** | Let users control density. Only Vercel dashboard does this. |
| 17 | **Keyboard shortcuts for 3D** | No competitor has this. Arrow keys for orbit, +/- for zoom, R for reset. |
| 18 | **Mobile 2D fallback** for 3D scene | Render a simplified 2D canvas trajectory when viewport < 768px or WebGL unavailable. |
| 19 | **Panel drag-to-reorder** | No competitor has customizable layout. |
| 20 | **Font sizing audit** | Minimum 11px for any text. Beat competitors' readability. |

---

## 7. Design Language Synthesis

Based on competitive analysis, our optimal design language should be:

```
Background:        #0a0e1a (current -- aligned with market)
Panel BG:          rgba(10, 20, 45, 0.85) with 1px cyan border
Primary accent:    #00d4ff (cyan -- market standard, keep)
Alert accent:      #ff6b35 (amber/coral -- aligned with artemislivetracker)
Safe/success:      #7fff00 (lime green for trajectory, status)
Warning:           #ffb830 (amber for approaching thresholds)
Danger:            #ff4444 (red for critical values)

Heading font:      Space Grotesk (current) -- differentiated from market's Orbitron
Telemetry font:    Space Mono (current) -- aligned with market's monospace standard
Label treatment:   UPPERCASE, letter-spacing: 1.5-2px, font-size: 10-11px
Value treatment:   font-size: 18-24px, font-weight: 600, tabular-nums

Panel style:       Glass morphism with low-opacity backdrop, thin cyan border, subtle box-shadow glow
Animations:        Pulsing status dots (1.4s), smooth number transitions (0.9s ease), star twinkle (2-7s)
```

---

## 8. Competitive Positioning Summary

```
                    Data Depth
                        ^
                        |
    artemislivetracker  |  * OrionWatch (TARGET)
           *            |
                        |
    vercel-dashboard *  |
                        |
  jasperbernaers *      |
                        |
           artemistracker * jameswebbtracker
                        |         *
    -------- -----------+-------------------> Visual Richness
                        |
         artemis2.live  |
              *         |
                        |       NASA AROW *
                        |       (Unity 3D, official data)
```

**Our target position:** Top-right quadrant -- matching artemislivetracker's data depth while exceeding ALL competitors on visual richness through true WebGL 3D. The only site that combines:

1. Real JPL Horizons telemetry (not simulated)
2. True Three.js 3D scene (not Unity, not 2D Canvas)
3. Live space weather with crew safety context
4. Multi-mission target support (unique in landscape)
5. Real-time updating charts (unique in landscape)
6. Accessible, responsive, performant

---

## Sources

- [NASA AROW - Track Artemis II in Real Time](https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/)
- [Artemis II Live Tracker](https://artemislivetracker.com/)
- [ArtemisLive.org](https://artemislive.org/)
- [Jasper Bernaers Artemis II Tracker](https://jasperbernaers.com/artemis-ii-tracker/)
- [Artemis Live Dashboard (Vercel)](https://artemis-live-dashboard.vercel.app/)
- [ArtemisTracker.com Watch Live](https://artemistracker.com/watch-live/)
- [James Webb Tracker - Artemis II](https://jameswebbtracker.com/artemis-ii)
- [Artemis2.live](https://artemis2.live/)
- [Lockheed Martin - Track Orion in Real Time](https://www.lockheedmartin.com/en-us/news/features/2026/track-orion-in-real-time-during-the-artemis-ii-mission.html)
- [How to track Artemis 2 - Space.com](https://www.space.com/space-exploration/artemis/how-to-track-the-artemis-2-astronauts-on-their-journey-around-the-moon)
- [GadgetGuy - Track the Moon Mission](https://www.gadgetguy.com.au/artemis-ii-launch-2026-how-to-watch-and-track-the-moon-mission-in-real-time/)
- [BBC Sky at Night - Track Artemis II](https://www.skyatnightmagazine.com/news/track-artemis-ii-mission-nasa-app)
