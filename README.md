# 🐧 PENGUIN ELEVATOR

<div align="center">

```
 ╔══════════════════════════════════════════════════════════════════╗
 ║                                                                  ║
 ║    █▀█ █▀▀ █▄ █ █▀▀ █  █ █ █▄ █    █▀▀ █  █ █▀▀ █  █ █▀█ ▀█▀ █▀█   ║
 ║    █▀▀ ██▄ █ ▀█ █▄█ █▄▄█ █ █ ▀█    ██▄ █▄▄█ ██▄ ▀▄▄▀ █▀█  █  █▄█   ║
 ║                                                                  ║
 ║                  3D VOXEL ISOMETRIC ARCADE PUZZLE                ║
 ║                                                                  ║
 ╚══════════════════════════════════════════════════════════════════╝
```

[![Geekatplay Studio](https://img.shields.io/badge/Developed%20By-Geekatplay%20Studio-orange.svg)](https://github.com/GeekatplayStudio)
[![Version](https://img.shields.io/badge/Version-v2.1-22c55e.svg)](#)

</div>

---

## 🎮 Game Overview

**Penguin Elevator** is an isometric 3D voxel puzzle arcade game developed by **Geekatplay Studio**. 

Guide crowded passengers through trapdoors in an ascending 3D voxel elevator while dodging the watchful eyes of penguin passengers!

### 🌟 Key Features

* **3D Voxel Directional Sprites**: High-resolution 3D voxel turnaround sprites (Front, Left, Right, Back).
* **Forward Vision Cone + Peripheral Awareness**: Penguins see **3 tiles straight ahead, 2 along each forward diagonal, and the single tile directly beside them** — drop someone right next to a penguin and it notices. Two tiles to the side, or anywhere behind, is **completely blind**.
* **Line of Sight Blocking**: A penguin standing in the way blocks the view behind it on *every* ray, diagonals included — so you can drop right in front of a watcher if a bystander is screening you.
* **Every Board Is Solvable**: An exact solver runs on every boarding and rotation — placements and turns are only accepted if the whole floor can still be cleared. Even a completely full elevator always has an escape order (verified across thousands of simulated floors). Full is no longer instant game over: you get a short **MAKE ROOM** countdown to dig yourself out.
* **Telegraphed Turns**: A penguin about to rotate shows a wind-up arrow first — no silent mid-ride spins invalidating a drop you already committed to.
* **A Meditative Difficulty Curve**: the solver is the difficulty dial. The generator keeps at least **4 simultaneously-safe drops** on the board through floor 20, easing to 3 by floor 50, 2 by floor 90, and never below 1 — so the game slides from "almost anything works" to "read the room" without a single sharp jump. Pacing follows suit: rides and boarding shorten by only 0.15s per 10 floors and never drop below a calm 4.5s / 4s, rotation stays rare, and rest floors give regular breathers. You are always meant to succeed.
* **Built-In Visual Tutorial**: A rotating illustrated how-to-play on the start screen explains dropping, vision, blocking, and fish — with **Play available at any moment**.
* **Vision Training Wheels**: Watched tiles glow softly through floor 25 and fade out by floor 50, teaching the vision cone by showing it.
* **Fish Treat Inventory**: Lure penguins into looking away with a fish treat. You start with one and earn another every 10 floors, so each placement is a real decision rather than a cooldown timer.
* **Responsive Mobile & Desktop Design**: Play on mobile browsers, desktop, or packaged natively for iOS & Android.
* **Completely Offline & Private**: No network requests, no accounts, no ads, no analytics, no data collection. See [Privacy](#-privacy).

---

## 📱 Mobile App (iOS & Android)

**Penguin Elevator** converts to native iOS and Android apps with
**Capacitor**, which wraps the existing `dist/` build in a native shell.

Build a signed Android release in one command:

```bash
npm run android:bundle    # signed .aab for Google Play
npm run android:apk       # signed .apk for sideloading
npm run android:debug     # debug .apk, no signing needed
```

The script preflights the JDK, SDK, signing keys and version code before it
hands off to Gradle. Signing credentials go in `android/key.properties` —
copy [android/key.properties.example](android/key.properties.example) and fill
it in. That file, and any `*.keystore` / `*.jks`, are gitignored and must
never be committed.

> Requires **JDK 21** (Capacitor 8 compiles the Android module at source
> level 21) and the Android SDK.

### iOS / App Store

iOS releases must be prepared on **macOS with Xcode 26 or newer** and the
iOS 26 SDK. From a fresh clone or pull on the Mac:

```bash
npm ci
npm run typecheck
npm run ios       # production build -> sync ios -> open Xcode
```

The tracked Xcode project is configured for iPhone, iOS 15+, automatic
signing, dSYM generation, dead-code stripping, and size-optimized Release
compilation. The current release is Version `2.1`, Build `5`.

In Xcode:

1. Select the `App` target and confirm the correct development team and bundle
   identifier `com.geekatplay.penguinelevator`.
2. Confirm **Version 2.1** and **Build 5**. Increase the build number before
   every new App Store Connect upload.
3. Select **Any iOS Device (arm64)**, then choose **Product → Archive**.
4. In Organizer, choose **Validate App** before **Distribute App → App Store
   Connect → Upload**.
5. Test the processed build through TestFlight before submitting it for review.

The generated `ios/App/App/public/` directory is intentionally gitignored.
`npm run ios` rebuilds and synchronizes it from `dist/`, preventing stale web
assets from entering the archive.

> **✅ The build is already self-contained.** Tailwind compiles at build time
> and the Press Start 2P / Silkscreen fonts are bundled locally, so the game
> plays correctly with no network — which store reviewers do test. Keep it
> that way: never reintroduce a CDN `<script>`, a Google Fonts link, or an
> import map into `index.html`.

The build loop is:

```bash
npm run android    # build -> sync android -> open Android Studio
```

```bash
npm run ios        # build -> sync ios -> open Xcode   (Mac only)
```

> **Run iOS synchronization on the Mac.** Capacitor on Windows rewrites
> `ios/App/CapApp-SPM/Package.swift` with backslash paths that SwiftPM cannot
> resolve on macOS. On Windows, use only `npx cap sync android`; on the release
> Mac, use `npm run ios` or `npx cap sync ios`.

Shipping a release? See **[RELEASING.md](RELEASING.md)**.

---

## 💻 Local Development

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation & Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/GeekatplayStudio/Penguin-Elevator.git
   cd Penguin-Elevator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

   Serves on **port 3000** by default. If that port is busy the server does
   **not** fail — it walks upward to the next free one (3001, 3002, …) and
   prints the URL it actually chose, so always use the address in the console
   output. To pin a specific port, set `PORT`:

   ```bash
   PORT=8080 npm run dev
   ```

4. **Build production bundle**:
   ```bash
   npm run build
   ```

5. **Type-check** (the build itself does not type-check — Vite strips types
   without verifying them, so run this before shipping):
   ```bash
   npx tsc --noEmit
   ```

---

## 🔒 Privacy

**Penguin Elevator collects nothing, sends nothing, and needs no internet
connection.** Full policy: [privacy-policy.md](privacy-policy.md).

| | |
|---|---|
| Network requests | **None.** No `fetch`, `XMLHttpRequest`, `WebSocket`, or `sendBeacon` anywhere in the app. All sprites, audio, and fonts are bundled locally. |
| Data collected | **None.** No accounts, no login, no email, no forms, no device identifiers. |
| Analytics / ads | **None.** No tracking SDKs of any kind, and no ATT prompt is needed. |
| Sharing / social | **None.** No share sheet, leaderboard, friend list, multiplayer, or external links. |
| Stored on device | Two numbers — your high score (`penguin-elevator-hs`) and best floor (`penguin-elevator-bf`). Never transmitted; removed on uninstall. |
| Permissions | **iOS: none. Android: `VIBRATE` only**, for drop haptics. `INTERNET` is deliberately not declared, so the app cannot reach the network even in principle. |

Both the App Store privacy label and Google Play Data Safety should be filled
in as **"Data Not Collected"** in every category.

If you ever add a leaderboard, ads, crash reporting, or cloud saves, update
[privacy-policy.md](privacy-policy.md) and the store privacy answers
together before shipping.

---

## 📜 Credits & Licensing

* **Studio**: [Geekatplay Studio](https://github.com/GeekatplayStudio)
* **Author**: Vladimir Chopine
* **Copyright**: © Geekatplay Studio by Vladimir Chopine. All rights reserved.
