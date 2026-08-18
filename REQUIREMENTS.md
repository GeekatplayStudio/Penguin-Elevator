# Penguin Elevator — Requirements & Design Doc

## 📋 Game Overview
A 2.5D isometric elevator-management stealth puzzle. Penguins stand on a 4x4
grid of trapdoor floor tiles. The player drops penguins through the trapdoors
into the elevator shaft below — but only when no other penguin is watching.
Getting caught ends the run.

## 🎮 Core Game Mechanics

### Grid & Platform
- **4x4 grid (16 tiles)** of trapdoor floor tiles, rendered in 2.5D isometric
  projection (`(x - y) * TILE_WIDTH/2`, `(x + y) * TILE_HEIGHT/2`).
- Each tile is drawn as a diamond top face plus two shaded side "slabs" to
  fake 3D depth, with rivets, panel seams and a brushed-metal gradient.
- Clicking an occupied tile attempts to drop that penguin; clicking an empty
  tile instead drops a fish treat there (distraction, see below).
- An opened trapdoor renders as a dark glowing hole with two swung-open
  leaves while the dropped penguin animates downward and fades out.

### Game Start
- The floor starts **half full**: `GRID_SIZE * GRID_SIZE / 2` (8 of 16 cells)
  are occupied by randomly placed, randomly typed penguins with random
  starting facing directions.

### Penguin Types & Behaviors
| Type | Spawn rate | Behavior |
|------|-----------|----------|
| STANDARD | 60% | Normal vision, rotates randomly each floor. |
| SLEEPY | 18% | Eyes closed (Zzz…), never sees anything, 50% chance to not rotate. Always safe to drop. |
| VIP | 12% | Worth 2x the base score (10 vs 5), wears a crown + sunglasses, sees normally. |
| JITTERY | 10% | Wears a red scarf, rotates with a jittery shake animation, sees normally. |

### Vision System (CRITICAL)
- Penguins face one of **4 cardinal directions** (`UP`, `DOWN`, `LEFT`,
  `RIGHT` — mapped to the isometric NW/SE/SW/NE screen directions and shown
  as ↖ ↘ ↙ ↗ badges).
- A penguin can only see **straight ahead along the direction it is facing**
  — nothing to its sides and nothing behind it. This is the "except from the
  back" rule: a penguin facing right can never notice a drop happening
  behind it.
- Vision is a straight ray that stops at the first other standing penguin
  (line-of-sight is blocked by bodies) or the edge of the grid.
- `SLEEPY` penguins never observe anything, regardless of facing direction.
- A **fish treat** temporarily overrides facing direction: every active
  penguin turns to look toward the treat instead of its normal facing.
- Direction badges and the amber vision-beam overlay are hidden by default
  to keep the board clean, and appear on hover or via the vision-lines
  toggle (`V` key / eye icon) so players can plan a safe drop.

### Turn / Floor Cycle
1. **STOPPED** — elevator arrives at a floor, brief pause.
2. **BOARDING** — doors open, 1 new penguin boards (3 if the floor was
   emptied), player has a window to drop penguins.
3. **CLOSING** — doors close.
4. **MOVING** — elevator ascends; partway through the climb, every standing
   penguin randomly rotates to a new facing direction (this is the "turn").
5. Floor count increments, score += `SCORE_PER_FLOOR`, cycle repeats.

### Drop Resolution
- On drop: compute witnesses = every other penguin whose vision ray reaches
  the target's cell.
- **No witnesses** → drop succeeds, score increases (VIP worth more,
  consecutive safe drops build a combo multiplier up to 4x).
- **Any witness** → all remaining penguins panic, the elevator halts, and the
  run ends (`GAME_OVER`, reason `CAUGHT`).
- If the floor fills to `MAX_CAPACITY` (16, the whole grid) boarding instead
  applies an overcrowding penalty to the score; repeated overcrowding while
  the score is already low ends the run (`GAME_OVER`, reason `BANKRUPT`).

### Fish Treat
- Distracts every penguin to look toward the treat's tile for a few seconds.
- Has a cooldown after use, shown as a fill bar on the treat button.

### Scoring
- `+5` per standard drop, `+10` per VIP drop, multiplied by combo (up to 4x)
  for consecutive safe drops in the same boarding window.
- `+1` per floor climbed.
- Overcrowding penalty subtracts from score; the run ends if score drops
  below `MIN_SCORE_THRESHOLD`.
- Goal: climb as many floors as possible before getting caught or going
  bankrupt.

## 🎨 Visual Design

### 2.5D Isometric Graphics
- Diamond tiles with gradient-shaded top faces, shadowed/highlighted side
  slabs, rivets and panel seams for an industrial elevator-floor look.
- Monitored (currently-watched) tiles pulse with a red hazard hatch overlay.
- Open trapdoors render as a radial-gradient "abyss" hole with a glowing
  ping effect as the penguin falls through.
- Penguins are built from layered pixel-art `<rect>` groups per facing
  direction, with a soft blurred ground-contact shadow, idle bob animation,
  and per-type accessories (VIP crown + sunglasses, SLEEPY nightcap, JITTERY
  scarf).
- Vision beams and direction badges are opt-in overlays (hover / `V` toggle)
  rather than always-on clutter.

### Elevator Shaft ("rising" pass)
- Fixed full-screen background behind the grid: glowing perspective floor
  grid, cyan guide rails down each side wall with animated pulley-cable
  ticks, and scrolling horizontal floor-marker bands on the walls that
  stream past while `MOVING`, selling the sensation of ascent.
- Vertical speed-line layers and a bright horizontal "passing floor" light
  flash sweep top-to-bottom while moving.
- Sliding double doors with panel detail and a handle, opening/closing in
  sync with `BOARDING`/`CLOSING` states, plus a soft green glow while open.
- A large translucent floor-number watermark and a HUD status panel
  (STATUS light, elevator state, level counter) sit above the shaft.

## 📱 Mobile Target
- `index.html` sets `html/body/#root` to `100%`/`100dvh` height explicitly
  (previously missing — this caused a **blank screen in fullscreen/non-sim
  view**, now fixed) plus `overscroll-behavior: none` and `touch-action:
  none` on the body so the page never scrolls or bounces on touch devices.
- A `MobileSimulatorFrame` (phone bezel chrome) is available for desktop
  testing via the monitor/smartphone icon toggle in the header; the
  underlying layout is written to work either inside that frame or as a true
  fullscreen mobile page.
- All interactive tiles use `touch-manipulation` and pointer events sized
  for thumbs; controls are anchored to the bottom safe area.
- This build is a web (Vite/React) prototype intended to be wrapped/ported
  to a native mobile shell (e.g. Capacitor) in a later pass — no native
  packaging is included yet.

## 🔧 Technical Requirements

### Stack
- React 19 + TypeScript
- Framer Motion (animations)
- Tailwind CSS (via CDN, styling)
- Vite (build tool)

### Code Quality
- `npx tsc --noEmit` passes with no errors.
- `npx vite build` succeeds.

### Browser Support
- Modern desktop browsers (Chrome, Firefox, Safari, Edge).
- Mobile browsers (iOS Safari, Chrome Mobile) — primary target.

## ✅ Validation Checklist
- [x] Build succeeds with no errors.
- [x] No TypeScript errors.
- [x] Isometric graphics render correctly in both Mobile Simulator and
      Fullscreen view modes.
- [x] Penguins render for all 4 facing directions with type accessories.
- [x] Vision system: single facing direction only, blocked by obstacles,
      never sees behind itself.
- [x] Floor starts half-occupied; new penguins board each stop.
- [x] Elevator shaft shows a clear rising/ascending pass effect while moving.
- [x] Fullscreen (non phone-frame) layout no longer renders blank.
