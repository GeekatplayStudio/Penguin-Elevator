# Penguin Elevator — Implementation Summary

Running notes on what is actually in the repo, newest pass first.

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
via Capacitor to both stores. The load-bearing part is the prep phase:
`index.html` fetches Tailwind and both pixel fonts from CDNs at runtime, plus
carries a dead `importmap` pointing at `aistudiocdn.com`. Packaged as-is the
app launches unstyled and in the wrong font whenever there is no network.
Also flagged: `viewMode` defaults to `MOBILE_SIM`, which would draw a fake
phone bezel *inside* a real phone.

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
