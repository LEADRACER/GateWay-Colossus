# Homepage Canvas - "The Living Constellation"

## Vision
> **A big sophisticated dynamic realtime animated art piece** that visualizes the GateWay:Colossus ecosystem as a living, breathing constellation of teams and projects. Not a dashboard — an experience.

---

## Core Concept: "Digital Organism"

The canvas is a **single full-viewport WebGL scene** that runs at 60fps, responding to:
- **Time** — ambient breathing, orbital mechanics
- **Cursor/Touch** — gravitational influence, particle attraction
- **Scroll** — camera dolly, layer parallax, FIRED section trigger
- **Data** — teams/projects feed positions, sizes, colors, connections

---

## Visual Layers (Z-Order: Back → Front)

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: UI OVERLAY                                        │
│  • Navigation, search, user menu                            │
│  • Showcase project cards (floating, clickable)             │
│  • Team name labels on hover                                │
└─────────────────────────────────────────────────────────────┘
│  LAYER 3: PROJECT ORBITS                                    │
│  • Ring systems around team nodes                           │
│  • Size = stars, Color = primary language                   │
│  • Showcased projects glow + pulse                          │
└─────────────────────────────────────────────────────────────┘
│  LAYER 2: TEAM CONSTELLATION                                │
│  • Nodes = teams (size = member count)                      │
│  • Edges = shared members / project collaborations          │
│  • Force-directed layout (d3-force or custom)               │
│  • Showcased teams: brighter, larger, subtle glow           │
└─────────────────────────────────────────────────────────────┘
│  LAYER 1: AMBIENT PARTICLE FIELD                            │
│  • 15,000–25,000 particles (GPU instanced)                 │
│  • Perlin noise flow field                                  │
│  • React to cursor (attraction/repulsion)                   │
│  • Color palette shifts by time of day / theme              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model (Canvas Consumes)

```typescript
// Fetched from /api/canvas/feed (cached, refreshed every 60s)
interface CanvasFeed {
  teams: CanvasTeam[];
  projects: CanvasProject[];
  edges: CanvasEdge[];           // team-team connections
  metadata: {
    totalTeams: number;
    totalProjects: number;
    totalStars: number;
    lastUpdated: string;
  };
}

interface CanvasTeam {
  id: string;
  code: string;                  // 6-char code
  name: string;
  slug: string;
  position: [x, y, z];           // normalized 0-1, set by force layout
  memberCount: number;
  projectCount: number;
  isShowcased: boolean;          // homepage or fired
  showcaseType?: 'homepage' | 'fired' | 'both';
  avatarUrl?: string;
  color: string;                 // derived from name hash or leader avatar
}

interface CanvasProject {
  id: string;
  teamId: string | null;         // null = individual
  name: string;
  stars: number;
  language: string | null;
  languageColor: string;         // hex
  isShowcased: boolean;
  position: [x, y, z];           // relative to team node
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
}

interface CanvasEdge {
  source: string;                // team code
  target: string;
  weight: number;                // 0-1 (shared members, collabs)
}
```

---

## Animation Systems

### 1. Ambient Particle Field (Layer 1)
```glsl
// Vertex Shader (GPU Instanced)
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uCursor;            // normalized 0-1
uniform float uCursorForce;      // 0-1, based on interaction

// Perlin noise flow field
vec2 flow = curlNoise(position * 0.5 + uTime * 0.02);
vec2 toCursor = uCursor - position.xy;
float dist = length(toCursor);
float influence = smoothstep(0.3, 0.0, dist) * uCursorForce;
position.xy += flow * 0.0005 + toCursor * influence * 0.001;

// Color by layer depth + time
color = mix(palette[0], palette[1], sin(uTime * 0.1 + position.z) * 0.5 + 0.5);
```

**Parameters:**
- Particle count: 20,000 (desktop), 8,000 (mobile)
- Point size: 1–2px, attenuated by depth
- Flow field speed: 0.02 units/sec
- Cursor influence radius: 30% viewport

### 2. Team Constellation (Layer 2)
- **Force-directed layout** (d3-force-3d or custom Verlet integration)
- **Forces:**
  - Repulsion: `k / d²` between all nodes
  - Attraction (edges): `k * d` along connections
  - Center gravity: weak pull to viewport center
  - Collision: radius = `baseSize * memberCount^0.3`
- **Update rate:** 30Hz (separate from render loop)
- **Showcased teams:** Fixed position (pinned), stronger gravity

### 3. Project Orbits (Layer 3)
```javascript
// Each project orbits its team node
project.position = [
  team.x + Math.cos(orbitPhase + time * orbitSpeed) * orbitRadius,
  team.y + Math.sin(orbitPhase + time * orbitSpeed) * orbitRadius * 0.6, // elliptical
  team.z + Math.sin(orbitPhase * 2 + time * orbitSpeed * 0.5) * orbitRadius * 0.3
];

// Orbit params derived from data:
orbitRadius = 0.02 + (project.stars / 10000) * 0.08;  // 2-10% viewport
orbitSpeed = 0.0001 + (project.stars / 50000) * 0.0005;
```

### 4. Showcased Projects (Special)
- **Homepage showcase**: Break orbit → float to "hero zone" (top-center)
- **FIRED showcase**: Pulse glow, subtle scale bounce on scroll enter
- **Transition**: Smooth lerp (0.8s ease-out) between orbit ↔ showcase position

---

## Interaction System

### Cursor/Touch (Gravitational)
| State | Behavior |
|-------|----------|
| Hover idle | Particles gently attracted (radius 25%) |
| Click/Touch hold | Strong attraction (radius 40%), particles swarm |
| Right-click / Long press | Repulsion burst (particles explode outward) |
| Move | Smooth follow with 0.15s lag (lerp) |

### Scroll (Camera Dolly)
| Scroll Progress | Camera | Layers |
|-----------------|--------|--------|
| 0–30% | Z: 1.0 → 0.85 | Parallax: Layer 1 (0.3x), Layer 2 (0.5x) |
| 30–60% | Z: 0.85 → 0.6 | Layer 1 fades, Layer 2 sharpens |
| **60%+** | **FIRED TRIGGER** | Layer 3 (projects) fades in, Canvas compresses |
| 100% | Z: 0.4 | FIRED section fully visible |

### Keyboard (Accessibility)
| Key | Action |
|-----|--------|
| `Space` | Pause/resume animation |
| `Arrow keys` | Rotate constellation (Y-axis) |
| `+/-` | Zoom in/out |
| `R` | Reset camera |
| `S` | Toggle stats overlay |

---

## Color System

### Palette (CSS Variables → WebGL Uniforms)
```css
:root {
  --canvas-bg: #0a0a0f;
  --particle-1: #1a1a2e;    /* Deep base */
  --particle-2: #16213e;    /* Mid */
  --particle-3: #0f3460;    /* Accent */
  --particle-4: #e94560;    /* Highlight (showcased) */
  --team-node: #ffffff;     /* White core */
  --team-glow: #00d4ff;     /* Cyan glow */
  --edge-color: rgba(255,255,255,0.08);
  --project-ring: var(--language-color);
}
```

### Team Colors (Deterministic)
```javascript
function teamColor(name: string): string {
  // Hash name → hue (avoid too dark/light)
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = (hash * 137) % 360;
  return `hsl(${hue}, 70%, 55%)`; // Consistent saturation/lightness
}
```

### Language Colors (Standard)
```javascript
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  // ... extend as needed
};
```

---

## Performance Budget

| Metric | Target |
|--------|--------|
| FPS | 60 (desktop), 30+ (mobile) |
| Frame time | <16.6ms (desktop), <33ms (mobile) |
| GPU memory | <150MB |
| Initial load | <2s (canvas init + first frame) |
| Data fetch | <500ms (cached) |

### Optimization Strategies
1. **GPU Instancing** — Single draw call for 20k particles
2. **Offscreen Canvas** — Decouple simulation from render
3. **LOD System** — Reduce particle count / update rate when tab hidden
2. **Frustum Culling** — Don't render off-screen orbits
3. **Texture Atlases** — Team avatars, project icons in single texture
4. **Web Workers** — Force layout + particle simulation off main thread

---

## Reduced Motion Fallback

```javascript
// Respect prefers-reduced-motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReduced) {
  // Static composition:
  // - Particles frozen (single frame)
  // - Constellation static layout
  // - No orbits, no cursor interaction
  // - Showcased projects prominently displayed
  // - Subtle CSS fade-in on scroll only
}
```

---

## Implementation Stack

| Layer | Technology |
|-------|------------|
| Renderer | **Three.js (r160+)** with custom shaders |
| Simulation | **Web Worker** (OffscreenCanvas) for particles + forces |
| Force Layout | **d3-force-3d** or custom Verlet in worker |
| UI Overlay | React (framer-motion) — portal over canvas |
| Data Fetch | SWR / React Query (60s stale-while-revalidate) |
| Scroll | **Lenis** or native `scroll` listener + RAF |

### Three.js Scene Structure
```
Scene
├── ParticleSystem (Points, InstancedBufferGeometry)
├── Constellation (Group)
│   ├── TeamNodes (Mesh — SphereGeometry + ShaderMaterial)
│   ├── Edges (LineSegments — BufferGeometry)
│   └── Labels (Sprite — CanvasTexture)
├── ProjectOrbits (Group)
│   └── ProjectRings (RingGeometry + ShaderMaterial)
├── ShowcaseZone (Group)
│   └── HeroProjects (Mesh + HTML overlay)
└── Camera (PerspectiveCamera, fov: 50)
```

---

## Data Feed API

```
GET /api/canvas/feed
Response: CanvasFeed (see Data Model)

Headers:
  Cache-Control: public, max-age=60, stale-while-revalidate=300
  ETag: "hash-of-data"
```

**Refresh Strategy:**
- Initial load: blocking fetch
- Background: every 60s (stale-while-revalidate)
- On showcase change: immediate revalidate (admin action)

---

## Mobile Adaptations

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Particles | 20,000 | 6,000 |
| Force update | 30Hz | 15Hz |
| Cursor interaction | Mouse + touch | Touch only |
| Orbits | Visible | Simplified (dots) |
| FIRED trigger | 60% scroll | 40% scroll |
| UI overlay | Full | Collapsed hamburger |

---

## Integration Points

| Component | Hook |
|-----------|------|
| `<HomepageCanvas />` | Mounts `<canvas>` full-screen, starts worker |
| `useCanvasData()` | SWR hook for `/api/canvas/feed` |
| `useScrollProgress()` | Returns 0-1, triggers FIRED reveal |
| `ShowcaseProjectCard` | React portal, positioned by canvas coords |
| `TeamTooltip` | React portal, follows team node |

---

## Future Extensions

| Feature | Feasibility |
|---------|-------------|
| Audio reactivity (Web Audio API) | High |
| Multiplayer cursors (presence) | Medium (Supabase Realtime) |
| Shader hot-reload (dev) | High |
| Export as video/WebM | Medium |
| AR/VR view (WebXR) | Low |

---

## References & Inspiration

| Reference | What to Borrow |
|-----------|----------------|
| [GitHub Globe](https://github.blog/2022-04-12-visualizing-github-data-with-the-github-globe/) | Geo visualization, particle systems |
| [Stripe's particle backgrounds](https://stripe.com) | Subtle, performant, brand-aligned |
| [Shadertoy "Galaxy" shaders](https://www.shadertoy.com) | Curl noise, galaxy spirals |
| [Three.js Journey](https://threejs-journey.com) | Production patterns |
| [d3-force-3d](https://github.com/vasturiano/d3-force-3d) | Force layout in 3D |

---

*Living document — update as design evolves*