# Penguin Elevator — Implementation Summary

This replaces the previous summary, which described a 3-direction vision
system that was never actually implemented in code. The notes below reflect
what is actually in the repo after the latest graphics/gameplay pass.

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

## 🚀 Next Steps (Optional)
- Real device testing (iOS Safari / Chrome Mobile) for touch feel and
  viewport edge cases (notches, dynamic toolbars).
- Consider wrapping in Capacitor/Cordova for an actual mobile app build once
  the web prototype is finalized, per the "target as mobile game, convert
  later" goal.
- Tune `TIMING` constants (`constants.ts`) for difficulty pacing once more
  playtesting data is available.
