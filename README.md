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
* **Realistic FOV & 3x3 Vision Radius**: Penguins watch **Front**, **Left**, and **Right** up to a 3x3 grid radius. The direction **directly behind their back is 100% blind**!
* **Progressive 10th-Level Scaling**:
  * **Levels 1–10**: Relaxed pacing with generous 4.5-second boarding times and 5.5-second floor travel.
  * **Every 10 Levels**: Elevator speed and rotation frequency increase slightly to challenge experienced players.
* **Treat Distractions**: Use fish treats to lure penguins into looking away.
* **Responsive Mobile & Desktop Design**: Play on mobile browsers, desktop, or packaged natively for iOS & Android.

---

## 📱 Mobile App (iOS & Android) Conversion Guide

**Penguin Elevator** is architected to easily convert into native mobile apps for iOS (App Store) and Android (Google Play Store) using **Capacitor.js**.

### Step 1: Install Capacitor CLI
```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/ios @capacitor/android
```

### Step 2: Initialize Capacitor Config
```bash
npx cap init "Penguin Elevator" "com.geekatplay.penguinelevator" --web-dir dist
```

### Step 3: Build Web Assets & Add Native Platforms
```bash
npm run build
npx cap add ios
npx cap add android
```

### Step 4: Sync & Launch Native IDEs
* **iOS**: `npx cap open ios` (Opens Xcode)
* **Android**: `npx cap open android` (Opens Android Studio)

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

---

## 📜 Credits & Licensing

* **Created & Developed By**: Vladimir Chopine
* **Studio**: [Geekatplay Studio](https://github.com/GeekatplayStudio)
* **Copyright**: © Geekatplay Studio by Vladimir Chopine. All rights reserved.
