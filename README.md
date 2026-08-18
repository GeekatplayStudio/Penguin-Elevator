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
[![Creator](https://img.shields.io/badge/Created%20By-Vladimir%20Chopine-38bdf8.svg)](https://github.com/GeekatplayStudio)
[![Version](https://img.shields.io/badge/Version-v3.0.0--mobile-22c55e.svg)](#)

</div>

---

## 🎮 Game Overview

**Penguin Elevator** is an isometric 3D voxel puzzle arcade game developed by **Geekatplay Studio** (created by **Vladimir Chopine**). 

Guide crowded passengers through trapdoors in an ascending 3D voxel elevator while dodging the watchful eyes of penguin passengers!

### 🌟 Key Features

* **3D Voxel Directional Sprites**: High-resolution 3D voxel turnaround sprites (Front, Left, Right, Back).
* **Graded Field of View**: Penguins see **3 tiles straight ahead**, but only **2 tiles to either side** — and the direction **directly behind their back is 100% blind**. Flanks are risky; the back is always safe.
* **Progressive 10th-Level Scaling**:
  * **Levels 1–10**: Relaxed pacing with generous 4.5-second boarding times and 5.5-second floor travel.
  * **Every 10 Levels**: Elevator speed and rotation frequency increase slightly to challenge experienced players.
* **Fish Treat Inventory**: Lure penguins into looking away with a fish treat. You start with one and earn another every 10 floors, so each placement is a real decision rather than a cooldown timer.
* **Responsive Mobile & Desktop Design**: Play on mobile browsers, desktop, or packaged natively for iOS & Android.

---

## 📱 Mobile App (iOS & Android)

**Penguin Elevator** converts to native iOS and Android apps with
**Capacitor**, which wraps the existing `dist/` build in a native shell.

**→ Full step-by-step runbook: [MOBILE_BUILD.md](MOBILE_BUILD.md)**

It covers store accounts and tooling, the prep work below, Capacitor setup,
icons and splash screens, signing, and both store submissions.

> **⚠️ Read the prep phase before packaging.** `index.html` currently loads
> Tailwind and the Press Start 2P / Silkscreen fonts from CDNs at runtime.
> That is fine for a web page and fatal for an app: with no network the game
> launches unstyled and in the wrong font, and store reviewers do test
> offline. Phase 2 of the runbook covers making the build self-contained —
> it must be done first.

Once the prep is complete, the loop is:

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

## 📜 Credits & Licensing

* **Created & Developed By**: Vladimir Chopine
* **Studio**: [Geekatplay Studio](https://github.com/GeekatplayStudio)
* **Copyright**: © Geekatplay Studio by Vladimir Chopine. All rights reserved.
