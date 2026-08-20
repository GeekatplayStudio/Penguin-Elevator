# Penguin Elevator — Implementation Summary

Running notes on what is actually in the repo, newest pass first.

---

# Pass: forward-diagonal vision, difficulty curve, tutorial, privacy hardening

## 1. Vision is a 5-ray cone including the forward diagonals

`VISION_RANGE` gained `FORWARD_DIAGONAL`, and `getVisionRays()` now returns
step *vectors* rather than cardinal directions, so diagonal rays are possible
at all:

```ts
export const VISION_RANGE = {
  FORWARD: 3, FORWARD_DIAGONAL: 3, SIDE: 2, BACK: 0,
} as const;
```

From its facing, a penguin watches five rays: forward (3), forward-left and
forward-right diagonals (3 each), and both sides (2). Everything behind it —
straight back *and* both back diagonals — is blind.

> This supersedes the previous pass's `{ FORWARD: 3, SIDE: 2, BACK: 0 }`.
> Diagonals were previously not watched at all, which made detection feel
> arbitrary: a penguin could be caught by a watcher it was standing diagonally
> in front of, with no visible reason.

Blocking was reworked into a shared `rayHitsTarget()` walker, so the first
standing penguin on a ray blocks it — on diagonals exactly as on straight
rays. `getMonitoredCells()` walks the same rays, so the on-screen overlay and
the actual detection can no longer disagree.

## 2. Difficulty ramps instead of starting hard

New helpers in `utils/gameLogic.ts`:

| Helper | Effect |
|---|---|
| `getWallFacingDirection()` | Faces a penguin at its nearest wall — back exposed, easy to read |
| `getSpawnDirection()` | Newcomers face a wall 85% of the time early, falling to fully random by ~floor 40 |
| `shouldBoardThisFloor()` | Skips boarding on even floors up to floor 8, so the room fills at half speed early |
| `rotateAllPenguins()` | Whole-floor rotation pass that **guarantees at least one turn per level** |

`startGame()` now opens with 3–4 penguins in the *corners*, each facing its
nearest wall. Timings start slower (6.5s travel, 6.0s boarding) and tighten
every 10 floors, floored at 3.2s / 2.8s. Per-penguin rotation chance rises
from 18% to a 65% cap.

`rotateAllPenguins()` exists because pure per-penguin rolls left whole levels
with no movement at all, which read as a bug. If nobody turns, one non-sleepy
penguin is forced to — always 90°, never a 180° flip.

## 3. Teaching tint and an illustrated tutorial

Watched tiles carry a soft red tint at full strength through floor 25, fading
linearly to zero by floor 50 (`teachOpacity` in `components/Grid.tsx`). The
`V` overlay still forces the strong tint at any floor.

`StartScreen` gained `TUTORIAL_SLIDES` — four auto-rotating illustrated
slides (drop, vision cone, blocking, fish) drawn with the real tile palette
and reference-sheet sprites, with dot navigation. **Play is always visible**,
so the tutorial never gates starting a game.

## 4. Privacy hardening — the game is now provably offline

- **Removed the score-sharing feature entirely.** `navigator.share` and
  `navigator.clipboard.writeText` are gone from `GameOverScreen`; the splash
  still shows score, floor, and date, but nothing leaves the device.
- **Removed the `define` block from `vite.config.ts`**, which injected
  `GEMINI_API_KEY` into the client bundle. Nothing read it, but anything
  placed there ships in plaintext to every player.

Audited: no `fetch` / `XHR` / `WebSocket` / `sendBeacon` in app code, no
analytics or ad SDKs, no permissions in `Info.plist`, and exactly one stored
value (`penguin-elevator-hs`). Verified at runtime by instrumenting the
network APIs during play — zero calls. See the privacy posture table in
`MOBILE_BUILD.md`.

## 5. Merged native packaging from `origin/main`

Capacitor iOS support (lifecycle audio pause/resume, haptics, `Preferences`
high score), the `ios/` Xcode project, privacy policy, and — importantly —
offline Tailwind and self-hosted fonts replacing the CDN import map. Gameplay
files were kept from this branch throughout; branding stays
"Geekatplay Studio by Vladimir Chopine".

---

# Pass: screen-aligned vision, fish inventory, native readiness

## 1. Facing axes are now screen-aligned, not isometric diagonals

`utils/gameLogic.ts` previously mapped `UP/DOWN/LEFT/RIGHT` onto the
isometric diagonals (NW/SE/SW/NE), so penguins faced tile *corners*. They now
face the flat *sides* of tiles:

| Direction | Vector | Reads as |
|-----------|--------|----------|
| `DOWN` | `{ x: 0, y: 1 }` | Toward the viewer (front sprite) |
| `UP` | `{ x: 0, y: -1 }` | Away from the viewer (back sprite) |
| `LEFT` | `{ x: -1, y: 0 }` | Screen left |
| `RIGHT` | `{ x: 1, y: 0 }` | Screen right |

This makes "which way is it looking?" legible at a glance, which the
diagonal mapping never was.

## 2. Vision is graded by angle instead of a uniform radius

Replaced `getVisibleDirections()` (a flat list of watched directions) with
`getVisionRays()`, returning each ray *and how far it reaches*:

```ts
export const VISION_RANGE = { FORWARD: 3, SIDE: 2, BACK: 0 } as const;
```

A penguin gets a clear long look straight ahead, catches only nearby
movement in the corner of its eye, and remains completely blind behind
itself. The blind spot is unchanged as the core stealth rule; the flanks are
now a graded risk rather than binary.

> This supersedes the note in the earlier pass below claiming a penguin
> "only ever sees along the single direction it's currently facing." That was
> accurate when written; sides are now watched at shorter range.

## 3. Fish treat is an inventory, not a cooldown

`fishCooldownRemaining` is gone from `GameState`, replaced by `fishCount`.
The player starts with one treat and earns another every 10 floors; placing
one spends it. `FISH_COOLDOWN` was removed from `constants.ts`. Turns the
treat from "wait for the bar to refill" into a resource worth saving.

## 4. New penguin animation states

Added to the `Penguin` type and driven from `App.tsx`:

- `isEntering` — waddle-in animation when a penguin boards
- `isPushed` — a shove plus spin when a newcomer displaces a neighbour
- `isDizzy` — a pre-drop wobble before the trapdoor opens
  (`TIMING.DIZZY_ANIMATION`, 450 ms)

## 5. Toolchain: type checking actually works now

`@types/react` and `@types/react-dom` were missing from the project
entirely. Because Vite builds with esbuild — which strips types without
checking them — and `tsconfig.json` leaves `strict`/`noImplicitAny` off,
`tsc` stayed silent while the editor reported **380 diagnostics**: every JSX
element as `JSX.IntrinsicElements`-less, every hook callback parameter as
implicit `any`.

Installing both type packages cleared 379 of them and exposed one real
defect in `App.tsx`: `nextPenguins` was inferred from a `.map()` that set
`isPushed`, making the property *required* on the inferred element type, so
the newly-boarded penguin literal (which omits it) did not fit. Annotated as
`Penguin[]` so it checks against the actual interface, where `isPushed` is
optional.

The codebase now passes `tsc --strict` with **0 errors**. Worth adding
`"strict": true` to `tsconfig.json` to lock that in.

## 6. Mobile packaging runbook

Added [`MOBILE_BUILD.md`](MOBILE_BUILD.md) — an eight-phase guide to shipping
via Capacitor to both stores. The load-bearing part was the prep phase:
`index.html` fetched Tailwind and both pixel fonts from CDNs at runtime, plus
carried a dead `importmap` pointing at `aistudiocdn.com`. Packaged as-is the
app would launch unstyled and in the wrong font whenever there was no network.
Also flagged: `viewMode` defaults to `MOBILE_SIM`, which would draw a fake
phone bezel *inside* a real phone.

> **Both are resolved as of the latest pass.** Tailwind and the fonts are
> bundled at build time, the import map is gone, and `viewMode` now defaults
> to `FULLSCREEN` on native via `Capacitor.isNativePlatform()`.

## 📊 Build status

```
✓ npx tsc --noEmit          -> no errors
✓ npx tsc --noEmit --strict -> no errors
✓ npx vite build            -> 2117 modules, ~375 KB / ~118 KB gzip
```

---

# Previous pass: graphics & fullscreen fixes

## ✅ Fixes & Improvements in this pass

### 1. Critical bug: fullscreen view rendered completely blank
- `index.html` never set an explicit height on `html`/`body`/`#root`.
- The mobile-simulator phone frame worked because it sets `h-screen`
  explicitly, but toggling to **Fullscreen** view removed that wrapper and
  left the app's `h-full` chain resolving to `0` — the whole game grid was
  invisible (confirmed by screenshot: header only, nothing below it).
- Fixed by setting `height: 100%` on `html`/`body`/`#root` and `100dvh` on
  `html`/`#root` in `index.html`, plus `overscroll-behavior: none` and
  `touch-action: none` on `body` for mobile.

### 2. Gameplay: floor now starts half-occupied
- `INITIAL_PENGUINS_COUNT` in `App.tsx` was hardcoded to `4` out of 16 cells.
- Changed to `Math.floor(GRID_SIZE * GRID_SIZE / 2)` (8 of 16) to match the
  intended "half floor full of penguins" start.

### 3. Documentation corrected
- `REQUIREMENTS.md` previously described a 3-direction (`DOWN/LEFT/RIGHT`)
  vision system with UP excluded as "behind." That was never what the code
  does — `gameLogic.ts` has always used 4 cardinal directions
  (`UP/DOWN/LEFT/RIGHT`), and a penguin only ever sees along the single
  direction it's currently facing, which already satisfies "never sees
  behind itself." Docs rewritten to match actual behavior instead of aspirational/stale claims.

### 4. Visual pass — floor tiles (`components/Grid.tsx`)
- Replaced flat fill colors with linear/radial SVG gradients per tile face
  (top, left slab, right slab) for a brushed-metal, lit-from-above look.
- Added diagonal seam lines and a soft highlight sheen on the top face.
- Open trapdoor "hole" now uses a radial gradient (cyan glow fading to
  black) instead of a flat fill, with a brighter inner glow ring.
- Monitored/hazard tiles get both the red hatch fill and a pulsing red
  outline stroke for clearer readability.

### 5. Visual pass — penguins (`components/Penguin.tsx`)
- Direction badge (↖/↘/↙/↗ + compass label) is no longer always-on clutter;
  it now appears on hover or when the vision-lines toggle is active, so the
  default board reads cleanly.
- Added a soft blurred ground-contact shadow under each penguin so they
  visually sit on their tile instead of floating.

### 6. Visual pass — elevator shaft (`components/ElevatorShaft.tsx`)
- Added a genuine "rising past floors" illusion: repeating horizontal marker
  bands scroll up the shaft walls while the elevator is `MOVING`.
- Added animated dashed guide-rail/cable ticks running down both side walls.
- Kept and tuned the existing speed-line layers and the sweeping "passing
  floor" light flash.

### 7. Verified in-browser
- Ran the dev server and drove the game via the Browser pane: start screen,
  half-populated first floor, vision-cone overlay (all 4 directions render
  with readable labels), a caught/"BUSTED" game-over flow, boarding →
  moving → floor increment cycle, and fullscreen mode (previously blank,
  now renders identically to the mobile-sim frame).

## 📊 Build Status
```
✓ npx tsc --noEmit -> no errors
✓ npx vite build -> 2117 modules transformed, ~379 KB / ~117 KB gzip
```

## 🚀 Next Steps
- Make the web build self-contained (bundle Tailwind + fonts, drop the dead
  import map) — Phase 2 of [`MOBILE_BUILD.md`](MOBILE_BUILD.md), and a
  prerequisite for everything else on this list.
- Real device testing (iOS Safari / Chrome Mobile) for touch feel and
  viewport edge cases (notches, dynamic toolbars).
- Wrap in Capacitor for actual store builds, per the "target as mobile game,
  convert later" goal.
- Add `"strict": true` to `tsconfig.json` now that the codebase passes it.
- Tune `TIMING` constants (`constants.ts`) for difficulty pacing once more
  playtesting data is available.
