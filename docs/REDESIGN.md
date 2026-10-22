# GateWay:Colossus — Full Frontend Redesign Plan

**Codename:** `green-terminal-v2`
**Status:** Planning — implementation not started
**Branch strategy:** incremental commits per phase on `main`

---

## 1. Vision

The site's identity is the **ANSI terminal** — the TerminalGrid engine built in Phase 1–4 is the only hero. Everything else gets out of its way: flat, matte, print-like surfaces in **near-black, phosphor green and muted gold**. No holograms, no gloss, no blur-glow, no parallax toys.

**Design principles**

1. **Terminal is the art.** Color/animation budget is spent there, not on decorative CSS effects.
2. **Matte, rough, printed.** Surfaces are flat fills; edges get dashed/dotted rules and corner ticks like box-drawing glyphs (`┌ ┐ └ ┘`). Zero `box-shadow` glows, zero `backdrop-blur`.
3. **Gold is a precious accent.** Green = primary/interactive. Gold = status, numbers, "featured/FIRED" moments. Gold is never used for both.
4. **Motion is meaning.** Animate: appearing content, state changes, navigations, lists. Never animate: decoration loops, floating, parallax, mouse followers.
5. **One motion system.** All variants live in `src/components/motion/`. No page defines its own animation objects.
6. **Modular.** Sections are self-contained server-friendly components; pages are thin assemblies.

**Kill list (old design)**

| Delete | Because |
|---|---|
| `src/components/ui/HolographicUI.tsx` (445 lines) | glossy gradients, glow, sheen — the exact anti-goal |
| `src/components/ui/ImmersiveTransitions.tsx` (403 lines) | blur/parallax/floating effects; replaced by modular motion lib |
| `CyberSentinelsTheme` + `--cyber-gold*` globals | dead theme layer; gold handled by tokens |
| `src/app/bootscreen/page.tsx` | boot screen concept folded into TerminalGrid BootScene |
| `src/components/features/StatsSection.tsx`, one-off home pieces | rebuilt as `sections/` |
| glow tokens / gradient CSS in `globals.css` | replaced by matte tokens |

---

## 2. Design tokens (`globals.css` `@theme` rewrite)

```css
@theme {
  /* Surfaces — near-black with a faint green cast, matte */
  --color-bg:               #0a0f0b;
  --color-bg-raised:        #10160f;   /* +3% lift for cards */
  --color-surface:          #131a13;
  --color-surface-hover:    #1a221a;
  --color-surface-alt:      #1e261e;   /* hover / selected */

  /* Borders — 1px hairlines, dashed variants for "rough" */
  --color-border:           #2a3328;
  --color-border-light:     #3a453a;

  /* Text */
  --color-text:             #d8e4d6;   /* warm white, not pure */
  --color-text-muted:       #8a9a86;
  --color-text-dim:         #5a685a;
  --color-text-on-accent:   #0a0f0b;

  /* Primary accent — phosphor green (matte, no neon glow) */
  --color-green:            #4a7c53;   /* buttons / links / active */
  --color-green-bright:     #6cc47a;   /* terminal echo, numbers */
  --color-green-dim:        #2e4a33;

  /* Secondary accent — old gold, used sparingly */
  --color-gold:             #c8a96a;
  --color-gold-dim:         #8a744a;

  /* Semantic */
  --color-error:            #c05b5b;
  --color-warning:          #c8a96a;  /* = gold */
  --color-info:             #7a9a8e;
}
```

Rules: no `*-glow` tokens anywhere. `box-shadow` allowed only as `inset 0 0 0 1px <border>` ring. Easing tokens stay.

**Texture utilities (rough matte) — new `src/app/globals.css` additions**

- `.rule-dashed` — `border: 1px dashed var(--border)` (rough edge)
- `.corner-ticks` — `::before/::after` box-drawing corner glyphs in mono font (optional per card)
- `.grain` — 2% `repeating-linear-gradient` 45° scanline at 1px — the only "texture", already CRT-consistent (reveal on: hero panels, big numbers)
- `.stamp` — mono uppercase, `letter-spacing: .08em`, gold border-left 2px — section labels

**Typography**: Geist Sans for UI, **Geist Mono becomes the identity face** — headings on decided pages stay sans; all labels/eyebrows/numbers/kbd are mono.

---

## 3. Modular structure (target)

```
src/
  app/                          # routes unchanged (Next 16 RSC-first)
  components/
    terminal/                   # existing engine — landing art (needs only origin re-check)
    shell/                      # Header, Footer, MobileNav, CommandHints
      Header.tsx                #   h-14, mono logo "GATEWAY:COLOSSUS", flat
      Footer.tsx                #   terminal status-line style: "24 teams · 3.1k stars · uptime 99%"
      Statusbar.tsx             #   fixed bottom 24px strip — scene · events · clock (§9.2)
      CommandPalette.tsx        #   ⌘K nav/actions/scene commands (§9.1)
      copy.ts                   #   every UI string, terminal voice (§9.5)
      constants.ts              #   TOP_INSET/BOTTOM_INSET imports for terminal engine
    motion/                     # THE motion system (new)
      variants.ts               #   all variant objects, springs, stagger factory
      PageTransition.tsx        #   route fade/translate wrapper (client)
      FadeIn.tsx                #   viewport-once reveal (opacity + 12px y)
      Stagger.tsx               #   staggered children list/grid
      CountUp.tsx               #   numbers (mono, green→gold for records)
      index.ts
    sections/                   # homepage sections (composable, server comps where possible)
      HeroTerminal.tsx          #   [interacts ONLY with TerminalGrid] hint strip + CTAs
      ShowcaseBoard.tsx         #   FIRED-homepage projects, gold-tagged cards
      TrendingList.tsx          #   ranked list, mono numbers
      TeamsIndex.tsx            #   constellation summary → link to /teams
      LiveFeedStrip.tsx         #   latest activities ticker chip-row (subscribes events bus)
    features/                   # page-scoped modules (projects/, teams/, admin/) — slim down
    ui/                         # primitives — rebuilt matte set
      Button, IconButton        #   flat fill / outline / ghost; dashed outline focus
      Card                      #   bg-raised + hairline border (+.rule-dashed variant)
      Badge, Tag                #   Tag=mono bordered chip; Badge=semantic
      Input, Textarea, Select   #   flat, mono caret green
      Tabs                      #   underline-only
      Modal, Drawer             #   matte overlay 70% black, no blur
      Skeleton                  #   shimmerless: pulsing surface-alt fill
      Avatar, Spinner, GithubIcon, Icon set (lucide only)
      EmptyState                #   ASCII-art panel (box-drawing) — on brand
      ErrorMessage, MarkdownRenderer, ImageFallback, CommentsSection, SocialButtons
```

Motion contract: primitives take `variant` tokens from `variants.ts`; nothing else in the app imports `framer-motion` directly except `ui/Modal`, `ui/Tabs` (state motion) — enforced by review + grep.

---

## 4. Motion system spec (`components/motion/variants.ts`)

```ts
export const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.6 }
export const fadeUp = { hidden: {opacity:0, y:12}, show: {opacity:1, y:0, transition:{duration:.45, ease:'easeOut'}} }
export const fade   = { hidden: {opacity:0}, show: {opacity:1, transition:{duration:.35}} }
export const popIn  = { hidden:{opacity:0, scale:.97}, show:{opacity:1, scale:1, transition: spring} }
export const slideX  (route transitions: in from -8px, out to 8px)
export const stagger  container factory(staggerChildren, delayChildren)
```

Rules (global):
- viewport reveals: `whileInView`, `viewport={{ once: true, margin: '-80px' }}`
- every primitive wraps `useReducedMotion()` → renders static visible
- no `filter: blur()`, no `letterSpacing` reveals (old LetterReveal), no y > 16px
- page transitions: 180ms opacity only (shared-element/parallax forbidden)
- lists: stagger 30–60ms, `once: true`

---

## 5. Page-by-page spec

### 5.1 Home (`/`) — the ANSI landing
Full-height TerminalGrid is global background (as now). Content restructure, top→bottom:

1. **HeroTerminal** — single h1 `GateWay:` / `Colossus` in mono (no LetterReveal; word enters with `fadeUp` once), one-line manifesto, primary CTA `Explore projects` (green flat) + secondary `Join a team` (outline). Chip strip: `?scene=` scene switcher (rain/constellation/ticker) — playful, ties to engine.
2. **ShowcaseBoard** — FIRED/homepage showcase projects: 2-col grid (masonry-ish), gold left border `.stamp` heads, tags mono.
3. **TrendingList** — top 10, mono rank numbers (gold for #1), green arrow on rank change.
4. **TeamsIndex** — 3 lines of live data (teams count, project count, stars) fed by `/api/feed/live` (already exists), each `CountUp`.
5. **LiveFeedStrip** — 6 latest activity lines from the terminal events bus, dashed rule separators.
6. Footer (shell from layout).

**Animations:** sections `FadeIn` once; list items `Stagger`; CTAs spring `scale .97→1` on hover/press; NO floating, no ScrollReveal wrappers, no `Parallax`, no hover-glow.

### 5.2 Auth
- `/auth/signin` — matte centered panel, mono copy, GithubIcon button; `fade` + spinner same.
- Auth callback untouched (route fn only).

### 5.3 Projects
- `/projects` — filter bar (Tabs underline + mono Tag chips), grid of matte Cards; skeletons static pulse; hovers: border-light + surface-hover (no lift). Pagination swap = `Stagger` re-entry.
- `/projects/[id]` — two-col: readme (MarkdownRenderer) left, meta rail right (stars gold mono, like/bookmark buttons flat, comments below); like/bookmark button press = `popIn` state; comment list stagger.
- `/projects/new`, `/projects/[id]/edit` — form panels; errors fade-slide in; submit button shows tiny mono progress, not glossy.

### 5.4 Teams
- `/teams` — list of team "roster cards" (name mono, member avatars stack, code badge `A7F3K2` dashed); new-team CTA.
- `/teams/[code]` — header panel (team code stamped gold), members table, join-request actions; role changes animate row highlight only.
- `teams/new`, `teams/[code]/edit`, `teams/[code]/members` — same form/table treatment; admin-only sections get error-red border when insufficient.

### 5.5 Trending / Profile / Bookmarks
- `/trending` — ranked table (mono), medal rows.
- `/profile/[id]` — profile header (avatar flat ring), stats `CountUp`, project grid reuses `Card`.
- `/bookmarks` — saved grid; empty state = ASCII box "no bookmarks" panel.

### 5.6 Admin (`/admin/**` ×8)
Deliberately **quiet**: one shared `AdminShell` (sidebar table-style: mono uppercase menu), tables with hover row tint only; risky buttons (moderate/delete) error-outline; no celebratory motion anywhere. Page-level: content `fade` 120ms.

### 5.7 Utilities
- `/dev-tty` — stays null-rendering preview page.
- `/bootscreen` — **delete** (BootScene covers it).
- 404/error — terminal panel: `command not found: /<path>` in mono, link home.

### 5.8 Shell
- **Header**: flat bg (`bg/85` + hairline bottom), logo in mono (`GATEWAY:COLOSSUS` with colon gold), UserMenu rebuilt on matte Dropdown; active route = green underline tick.
- **Footer**: status-line, hairline top, mono.
- **Statusbar** (§9.2): fixed bottom strip on all pages — scene cycler, live event counter, UTC clock.
- **CommandPalette** (§9.1): ⌘K from Header/UserMenu; nav, actions, scene commands.
- **MobileNav**: sheet slides (280ms), no blur scrim.

---

## 6. Theme strategy for TerminalGrid

- `TerminalGrid` keeps engine/canvas; **palette.ts** stays as-is (phosphor ramp already matches).
- Home scenes get a small gold pass: AMBER is already our gold (`C.AMBER #C8A96A` equivalent) — Constellation/Ticker already amber-accented. Only tweak: RainFG green === `--color-green-bright` alignment in `palette.ts` to unify UI text ↔ terminal.
- Remove CRT vignette overlay opacity if it fights the new flat content; keep scanlines at reduced opacity `.04`.
- Re-verify `TOP_INSET = 56` after Header rebuild — factor it from a shared constant import (`shell/constants.ts`) instead of hard-coded.

---

## 7. Implementation phases

### P0 — Foundations (1 commit) — DONE (3c1c768)
- [ ] `globals.css` token rewrite + texture utilities; delete glow/gradient blocks
- [ ] `components/motion/` library (`variants.ts` incl. §9.6 recipes, FadeIn, Stagger, PageTransition, CountUp)
- [ ] Delete HolographicUI / ImmersiveTransitions USAGE references (page.tsx de-holographed in P1, but imports must not dangle)
- [ ] Delete `bootscreen` route, CyberSentinelsTheme wires from layout
- [ ] `shell/` Header+Footer v1 + `constants.ts` + `copy.ts`; remove old layout feature imports
- [ ] BootScene first-visit-only flag (sessionStorage) + `BOTTOM_INSET=24` Statusbar reservation
- **Verify:** tsc, eslint, home boots, header/footer visible

### P1 — Home rebuild (1 commit) — DONE (11b1e13)
- [ ] `sections/` five components (fetch via existing `/api/feed/live` + services; no new endpoints)
- [ ] `page.tsx` becomes thin `HeroTerminal + sections` assembly, ~150 lines
- [ ] Terminal palette text-alignment tweak + scanline opacity
- [ ] `Statusbar.tsx` live (scene cycle + event count + clock)
- **Verify:** screenshots (`?scene=` switcher works, feed strip hydrates, LCP sane)

### P2 — Primitives swap (1–2 commits) — DONE (c12dda4)
- [ ] Rebuild `ui/` matte set (Button/Card/Tag/Badge/Input/Modal/Tabs/Skeleton/EmptyState…)
- [ ] Replace usages page-by-page: projects → teams → trending/profile/bookmarks
- [ ] `CommandPalette.tsx` (⌘K) wired in Header
- [ ] `/dev/ui` design shelf page
- **Verify:** per-page screenshots, tsc, palette keyboard round-trip

### P3 — Motion sweep on all pages (1 commit) — DONE (a2f3f9d)
- [ ] Apply FadeIn/Stagger/PageTransition across every route incl. admin AdminShell
- [ ] Route transition wrapper in root layout (template.tsx approach if simpler: `app/template.tsx` w/ 180ms fade)
- [ ] `loading.tsx` + `error.tsx` + `not-found.tsx` parity set (§9.4)
- **Verify:** reduced-motion audit, animation checklist per page (checked off on `/dev/ui`)

### P4 — Cleanup & polish — DONE (whitelist audit clean, a11y pass, next build green)
- [ ] Delete removed-design leftovers; grep `framer-motion` import whitelist
- [ ] Lighthouse/a11y pass; contrast check green-on-black ≥ 4.5 body text
- [ ] Copy sweep: every string through `copy.ts`
- **Verify:** `npm run build`, full-route smoke via dev + prod deploy screenshot

Each phase ends with commit + `git push` (Vercel autodeploy).

---

## 8. Constraints & risks

- **Next 16/Turbopack + React 19 + framer-motion 11.x**: compatible; use `"use client"` in motion primitives only.
- **Terminal z-order**: content must remain above canvas (`-z-10` background preserved); every new section gets `bg` only where readability demands (hero text stays direct-on-terminal).
- **Auth/admin routes untouched** — this is view-layer only; no API/DB changes.
- **No new deps** except `framer-motion` (already present).
- Keep `?(scene|demo|next)` URL params working.

## 9. Overhaul additions v1.1

Beyond the flat restyle, five flagship upgrades make the redesign feel like a *product of the terminal*, not just a reskin:

### 9.1 Command Palette (`⌘K` / `Ctrl+K`)
- `shell/CommandPalette.tsx` — fullscreen overlay (matte 70% black, **no blur**), centered mono panel max-w-xl
- Content: fuzzy-filtered commands — navigation (`projects`, `teams`, `trending`, `profile`, `admin/*` if admin), actions (`new project`, `new team`, `sign out`), and **terminal fun**: `scene:rain`, `scene:constellation`, `scene:ticker` (drives `?scene=` without reload)
- Rows: `[ > ]` prompt glyph, `↑↓` navigate, `↵` go, `esc` dismiss; matched substring tinted green
- Bottom hint bar: `filter: 3/12 · ⏎ open · esc close`
- Zero page-load cost: lazy-chunk on first open; **no new dep** — build on `ui/Input` + `motion/` (≈120 lines); keyboard context lives in `shell/`
- Keyboard shortcut changes only on desktop input focus (skip when typing in inputs)

### 9.2 Terminal Status Bar (fixed bottom)
- `shell/Statusbar.tsx` — 24px fixed strip, hairline top, full-width, mono 11px, replaces nothing (Footer stays for page bottom) on `/` only? **Decision: all pages** — it *is* the terminal chrome
- Segments: `▌rain` (current scene, click cycles) · live event count `evt 4` (pulses green once on new event) · UTC clock `14:03:22Z` (1s tick, silent) · right: `gw:colossus v2`
- Uses existing `events.ts` bus + scene context; hides `reduced-motion` clock pulse
- `TerminalGrid` origin: add 24px bottom inset — reserve via `shell/constants.ts` (`TOP_INSET=56`, `BOTTOM_INSET=24`)

### 9.3 Design shelf route `/dev/ui`
- Single hidden page (linked from footer only) rendering **every ui/ + motion/ primitive** in a labeled grid with usage notes — a living style guide
- Sits next to `/dev-tty`; both under `shell/constants.PUBLIC_PATHS` treatment (auth-exempt)
- QA tool: P3 "motion sweep" checklist renders directly from this page
- Not animated except hover/focus demos — keeps in-repo and production-safe

### 9.4 Route-level loading/error parity
- `loading.tsx` for content-heavy routes (`projects`, `projects/[id]`, `teams`, `teams/[code]`, `trending`, `profile/[id]`): a mono "fetching…" line + static pulse block — no skeletons zoo
- `error.tsx` (root + segments): terminal panel `err: <message>` + `[ retry ]` — replaces ad-hoc "Something went wrong" glossy card
- `not-found.tsx`: `command not found: /<path>` mono panel (was 404 note in §5.7)
- Same EmptyState/ErrorMessage everywhere: no page-invented fallbacks

### 9.5 Copy & micro-typography system
- Terminal voice: descriptions lowercase-ish, matters-of-fact; buttons as verbs or `[ verb ]`; tags rendered `#type:typescript`; numbers always mono + tabular-nums
- Dictionary file `shell/copy.ts` (or plain co-location) — every UI string lives there; a small sweep fixes inconsistent titles/labels sitewide
- Type scale: 12 / 13 / 15 / 18 / 24 / 32 / 48 (mono for ≤15, sans above); `line-height` 1.4 body, 1.1 display
- Spacing rhythm: 4px grid; sections 96px apart on desktop, 64px mobile; container `max-w-6xl` everywhere (no mixed widths)

### 9.6 Motion recipes appended to `variants.ts`
```ts
export const press  // Buttons: scale 0.97 in, back out (spring)
export const rowIn   // Table/list rows: fade + 6px y, once
export const overlay // Modal/Drawer/Palette: panel popIn + scrim fade
export const toastIn // from right 12px, 240ms
export const numberTick // CountUp: mono digits roll, 500ms, gold target
```
Every recipe maps 1:1 to a ui primitive — no ad-hoc motion strings in pages.

---

## 10. Open questions (defaulted)

1. Boot sequence on every visit? → *No* — BootScene plays once per session (`sessionStorage` flag).
2. Home H1 keep "GateWay:Colossus" two-line lockup? → *Yes, sharpened mono, gold colon*.
3. Admin look = same tokens, fewer animations? → *Yes, deliberately quiet*.
4. Status Bar visible on all pages or home only? → *All pages* (it's terminal chrome).
5. Command Palette in v1 scope? → *Yes (§9.1) — it's cheap and cements identity.*
6. `/dev/ui` shelf public? → *Linked from footer, no auth gate* (dev artifact).

