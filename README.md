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
[![Version](https://img.shields.io/badge/Version-v3.0.0--mobile-22c55e.svg)](#)

</div>

---

## 🎮 Game Overview

**Penguin Elevator** is an isometric 3D voxel puzzle arcade game developed by **Geekatplay Studio**. 

Guide crowded passengers through trapdoors in an ascending 3D voxel elevator while dodging the watchful eyes of penguin passengers!

### 🌟 Key Features

* **3D Voxel Directional Sprites**: High-resolution 3D voxel turnaround sprites (Front, Left, Right, Back).
* **Forward Vision Cone**: Penguins see only what's **in front of them** — 3 tiles straight ahead and 2 along each forward diagonal. Sides and everything behind are **completely blind**. What the sprite's face points at is exactly what it sees.
* **Line of Sight Blocking**: A penguin standing in the way blocks the view behind it on *every* ray, diagonals included — so you can drop right in front of a watcher if a bystander is screening you.
* **Every Board Is Solvable**: An exact solver runs on every boarding and rotation — placements and turns are only accepted if the whole floor can still be cleared. Even a completely full elevator always has an escape order (verified across thousands of simulated floors). Full is no longer instant game over: you get a short **MAKE ROOM** countdown to dig yourself out.
* **Telegraphed Turns**: A penguin about to rotate shows a wind-up arrow first — no silent mid-ride spins invalidating a drop you already committed to.
* **Learn-As-You-Play Difficulty**:
  * **Levels 1–10**: Very relaxed — 6-second boarding, 6.5-second floor travel, penguins start in the corners facing the walls, and newcomers mostly face the nearest wall.
  * **Every 10 Levels**: Pacing tightens and facing gets more random, never dropping below 2.8s boarding / 3.2s travel.
  * **Every Level**: At least one penguin always turns, so the board never stalls.
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
> level 21) and the Android SDK. iOS builds require a Mac with Xcode.

> **✅ The build is already self-contained.** Tailwind compiles at build time
> and the Press Start 2P / Silkscreen fonts are bundled locally, so the game
> plays correctly with no network — which store reviewers do test. Keep it
> that way: never reintroduce a CDN `<script>`, a Google Fonts link, or an
> import map into `index.html`.

The build loop is:

```bash
npm run build      # web assets -> dist/
npx cap sync       # dist/ -> native projects
npx cap open android
```

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
| Stored on device | One value — your high score — under `penguin-elevator-hs`. Never transmitted; removed on uninstall. |
| Permissions | **None requested.** No location, camera, microphone, contacts, photos, or notifications. |

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
