# Shipping Penguin Elevator to Android & iOS

A step-by-step runbook for turning this Vite + React web game into native apps on the Google Play Store and Apple App Store.

**Route: Capacitor.** The game is already touch-first (`MobileControls`, tap-to-drop, portrait layout), so there is no reason to rewrite it. Capacitor wraps the existing `dist/` build in a native shell, gives you real store binaries, and leaves the codebase as-is.

> Version numbers are deliberately omitted below — install with `@latest` and record what you actually got. Store policies (target API levels, screenshot sizes, testing requirements) change every year; verify each one in the console before you submit.

---

## Contents

- [Phase 1 — Prerequisites and accounts](#phase-1--prerequisites-and-accounts)
- [Phase 2 — Make the web build self-contained](#phase-2--make-the-web-build-self-contained)
- [Phase 3 — Make it behave like an app](#phase-3--make-it-behave-like-an-app)
- [Phase 4 — Add Capacitor](#phase-4--add-capacitor)
- [Phase 5 — Icons and splash screen](#phase-5--icons-and-splash-screen)
- [Phase 6 — Android build and Play submission](#phase-6--android-build-and-play-submission)
- [Phase 7 — iOS build and App Store submission](#phase-7--ios-build-and-app-store-submission)
- [Phase 8 — The update loop](#phase-8--the-update-loop)
- [Pre-submit checklist](#pre-submit-checklist)

---

## Phase 1 — Prerequisites and accounts

### 1.1 Tooling

| Target | You need | Notes |
| --- | --- | --- |
| Android | Android Studio + JDK 17 | Works on your Windows machine |
| iOS | A Mac + Xcode + CocoaPods | **Cannot be done on Windows** |

Android Studio installs the SDK, platform tools and an emulator. Accept the SDK licenses on first launch.

**On the iOS problem.** There is no legal way to build and sign an iOS app from Windows. Your options:

1. **Buy or borrow a Mac** (a Mac mini is the cheap entry) — simplest, full control.
2. **Rent a cloud Mac** (MacStadium, MacinCloud) — hourly, fine for occasional releases.
3. **Cloud CI** (Codemagic, Bitrise, GitHub Actions `macos-*` runners) — build and upload from a config file. Best long-term, but the initial certificate and provisioning setup is the fiddliest thing to do sight-unseen.

Ship Android first regardless. It is the faster loop and it shakes out the bugs.

### 1.2 Accounts

| Account | Cost | Notes |
| --- | --- | --- |
| Google Play Developer | $25 one-time | Approval can take a few days |
| Apple Developer Program | $99/year | Required to ship to the App Store at all |

Register both **now** — identity verification is the slowest step and it blocks everything else.

### 1.3 Pick your identifiers

Decide once, because changing them later means starting a new store listing:

- **App ID / bundle ID:** `com.geekatplay.penguinelevator` (reverse-DNS, permanent)
- **App name:** `Penguin Elevator`
- **Version:** starts from `package.json` at `3.0.0`

---

## Phase 2 — Make the web build self-contained ✅ DONE

**This phase is complete.** The build is fully offline: no CDN, no Google
Fonts, no import map. Every asset ships inside the bundle, and the game makes
zero network requests at runtime.

To re-verify at any time, run `npm run build && npx vite preview`, disconnect
the network, and hard-reload — the game must play identically.

The rest of this phase documents how it was wired, for whoever maintains it.

### 2.1 Tailwind is a build step, not a CDN ✅

Tailwind v3 runs through PostCSS at build time (`tailwind.config.js`,
`postcss.config.js`). The old `https://cdn.tailwindcss.com` script is gone from
`index.html`.

v3 was chosen deliberately over v4: the old CDN script *was* v3, so this was a
like-for-like swap with identical rendering. Migrating to v4 at the same time
as going native would mean debugging two problems at once.

```bash
npm i -D tailwindcss@^3.4 postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js` — the content globs must cover every file that writes a class name:

```js
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
```

Create `styles.css` at the project root:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Import it at the top of `index.tsx`:

```ts
import './styles.css';
```

Tailwind's `preflight` reset (inside `@tailwind base`) is the usual source of
small visual differences — if anything shifts after a Tailwind upgrade, look
there first.

### 2.2 Fonts are self-hosted ✅

`Press Start 2P` and `Silkscreen` are bundled locally via `@fontsource`, not
fetched from Google Fonts. They are the entire visual identity of the game;
falling back to generic monospace is not graceful degradation.

```bash
npm i @fontsource/silkscreen @fontsource/press-start-2p
```

In `index.tsx`, above the `styles.css` import:

```ts
import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/press-start-2p/400.css';
```

The `preconnect` hints and the `fonts.googleapis.com` stylesheet link have been
removed from `index.html`.

### 2.3 Import map removed ✅

`index.html` previously carried an `importmap` pointing every dependency at
`aistudiocdn.com`. Vite bundles these from `node_modules`, so it was inert in
the built output — but it was a live CDN reference sitting in the shipped HTML.
The whole `<script type="importmap">` block is gone.

### 2.4 Verify offline

```bash
npm run build
npx vite preview
```

Disconnect the network, hard-reload, and play a full round. Pixel fonts correct, layout correct, music plays, sprites load.

**Do not move to Phase 4 until this passes.** A Capacitor shell has no network by definition on a plane, and debugging CSS through Xcode is far more painful than debugging it here.

### 2.5 Secret-injection footgun removed ✅

`vite.config.ts` used to define `process.env.API_KEY` and
`process.env.GEMINI_API_KEY` from a `GEMINI_API_KEY` env var. Nothing read
them, and the `define` block is now deleted.

Keep it that way: anything placed in `define` is inlined into the client bundle
in plaintext and ships to every player. This game needs no keys or secrets.

---

## Phase 3 — Make it behave like an app

A web page in a native shell is obvious to users and to Apple's reviewers — App Store guideline 4.2 (Minimum Functionality) exists to reject exactly that. These changes are what make it read as a real game.

### 3.1 Turn off the fake phone frame on real phones

`App.tsx` initialises `viewMode: 'MOBILE_SIM'`, which wraps the game in `MobileSimulatorFrame` — a drawn phone bezel with a notch and a home indicator. That is great on desktop and absurd on an actual phone: a phone inside a phone.

```ts
import { Capacitor } from '@capacitor/core';

// in the useState initialiser
viewMode: Capacitor.isNativePlatform() ? 'FULLSCREEN' : 'MOBILE_SIM',
```

Consider hiding the view-mode toggle in `Header` on native too — it has no purpose there.

### 3.2 Handle the notch and home indicator

In `index.html`, add `viewport-fit=cover` so the app can paint edge to edge:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Then keep your UI out of the hardware's way. In the inline `<style>`:

```css
#root {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}
```

`Header` and `MobileControls` are the two things that will collide with the status bar and the home indicator. Check both on a notched device.

### 3.3 Lock the orientation

The game is portrait-only by design. Enforce it natively rather than in JS:

- **Android** — `android/app/src/main/AndroidManifest.xml`, on the `<activity>`: `android:screenOrientation="portrait"`
- **iOS** — Xcode → target → General → Deployment Info → uncheck both landscape orientations

### 3.4 Make the high score survive

`localStorage` works in both web views, but iOS can evict web view storage under disk pressure. For a high score you want to keep, use the Preferences plugin, which writes to `SharedPreferences` / `UserDefaults`:

```bash
npm i @capacitor/preferences
```

Note the API is **async**, so the three `localStorage` calls in `App.tsx` (around lines 41, 140 and 345) become promises:

```ts
import { Preferences } from '@capacitor/preferences';

// load
useEffect(() => {
  Preferences.get({ key: 'penguin-elevator-hs' }).then(({ value }) => {
    if (value) setGameState(prev => ({ ...prev, highScore: parseInt(value, 10) }));
  });
}, []);

// save
Preferences.set({ key: 'penguin-elevator-hs', value: newHigh.toString() });
```

### 3.5 Stop the music when the app backgrounds

Nothing currently listens for the app losing focus, so music keeps playing after the user switches away — a reliable source of one-star reviews.

```bash
npm i @capacitor/app
```

```ts
import { App as CapApp } from '@capacitor/app';

useEffect(() => {
  const sub = CapApp.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) audioManager.pauseMusic();
    else if (!gameState.isMuted) audioManager.resumeMusic();
  });
  return () => { sub.then(s => s.remove()); };
}, [gameState.isMuted]);
```

Add `pauseMusic` / `resumeMusic` to `AudioController` in `utils/audio.ts` if they are not there yet — it already tracks `musicEl`, so both are two-liners.

Your existing touch-unlock in `App.tsx` (the `click` / `touchstart` listener calling `audioManager.unlock()`) is exactly right for iOS and needs no change. Be aware that iOS respects the hardware mute switch for web view audio — a silent device means a silent game, and that is expected behaviour, not a bug.

### 3.6 Handle the Android back button

Without this, back either does nothing or kills the app mid-game.

```ts
CapApp.addListener('backButton', () => {
  if (gameState.phase === 'PLAYING') {
    setGameState(prev => ({ ...prev, phase: 'START_MENU' }));  // or pause
  } else {
    CapApp.exitApp();
  }
});
```

### 3.7 Add haptics

Cheap, and it is the single change that most makes a wrapped web game feel native. Fire a light impact on a successful drop, a heavier one on getting caught.

```bash
npm i @capacitor/haptics
```

```ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';
Haptics.impact({ style: ImpactStyle.Light });
```

---

## Phase 4 — Add Capacitor

### 4.1 Install and initialise

```bash
npm i @capacitor/core
npm i -D @capacitor/cli
npx cap init "Penguin Elevator" com.geekatplay.penguinelevator --web-dir dist
```

### 4.2 Configure

Edit the generated `capacitor.config.ts`. The background colours matter — they are what shows during launch and behind the web view. Use the game's own `#0b0e14`, or you get a white flash on every cold start.

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geekatplay.penguinelevator',
  appName: 'Penguin Elevator',
  webDir: 'dist',
  android: { backgroundColor: '#0b0e14' },
  ios: { backgroundColor: '#0b0e14', contentInset: 'never' },
  plugins: {
    SplashScreen: {
      backgroundColor: '#0b0e14',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
```

Leave Vite's `base` at its default `/`. Capacitor serves `dist/` from the web root, so the absolute asset paths in `utils/audio.ts` (`/audio/bg-1.mp3`) resolve correctly. Setting `base` to `./` is the usual fix for `file://` shells and is **not** needed here.

### 4.3 Add the platforms

```bash
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios        # macOS only
```

This creates `android/` and `ios/` — real native projects. **Commit them.** They hold your signing config, icons and manifest edits.

### 4.4 The build cycle

Burn this into muscle memory. Capacitor copies `dist/` into the native projects; it does not build for you.

```bash
npm run build      # web assets -> dist/
npx cap sync       # dist/ -> native projects, plus plugin wiring
npx cap open android
```

Run `sync` after every plugin install. `npx cap copy` alone is enough when only web code changed.

### 4.5 Add to .gitignore

```
android/app/build/
android/build/
android/.gradle/
ios/App/build/
ios/App/Pods/
*.keystore
*.jks
key.properties
```

Keystores must never be committed. Back them up elsewhere — see 6.2.

---

## Phase 5 — Icons and splash screen

Draw one **1024×1024 PNG**: no transparency, no rounded corners (the OS masks it for you). `public/sprites/hero.png` is the obvious starting point — scale it with nearest-neighbour so it stays crisp, and do not let a smooth resampler blur the pixel art.

```bash
mkdir -p resources
# put icon.png (1024x1024) and splash.png (2732x2732, art centred) in resources/
npx @capacitor/assets generate --iconBackgroundColor '#0b0e14' --splashBackgroundColor '#0b0e14'
```

This writes every density Android and iOS need, including adaptive icons and dark variants. Re-run it whenever the art changes, then `npx cap sync`.

Also install the splash screen plugin so you control when it hides — otherwise it can disappear before React has painted, showing a blank frame:

```bash
npm i @capacitor/splash-screen
```

```ts
import { SplashScreen } from '@capacitor/splash-screen';
// after first render, e.g. in an effect in App.tsx
SplashScreen.hide();
```

---

## Phase 6 — Android build and Play submission

### 6.1 Run it on a real device

Enable Developer Options → USB debugging on the phone, plug it in, then:

```bash
npm run build && npx cap sync
npx cap open android
```

Press Run in Android Studio and play a full round. Check: portrait lock, safe areas, audio, back button, high score surviving a force-quit, and the whole thing in airplane mode.

### 6.2 Create a signing key

One keystore signs every future update. **Lose it and you cannot update your own app.**

```bash
keytool -genkey -v -keystore penguin-upload.jks -alias penguin \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store the file and its passwords in a password manager, plus one offline backup. Opt into **Play App Signing** when you create the listing — Google then holds the real signing key and yours is only an upload key, which is recoverable if lost.

Wire it up in `android/key.properties` (gitignored):

```properties
storePassword=…
keyPassword=…
keyAlias=penguin
storeFile=../penguin-upload.jks
```

Reference it from `android/app/build.gradle` in a `signingConfigs` block applied to `release`. Android Studio's **Build → Generate Signed App Bundle** wizard will write this for you if you prefer clicking.

### 6.3 Set the version

`android/app/build.gradle`:

```gradle
versionCode 1        // integer, MUST increase on every upload
versionName "3.0.0"  // the string users see
```

Play rejects a `versionCode` it has already seen. Bump it on every upload, including ones that failed review.

### 6.4 Build the bundle

Play requires an **AAB**, not an APK:

```bash
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`.

Build an APK too if you want to sideload to testers directly: `./gradlew assembleRelease`.

### 6.5 Create the Play listing

In the Play Console, create the app, then work through everything it marks required:

- **Store listing** — short description (80 chars), full description (4000), app icon 512×512, feature graphic **1024×500**, and at least 2 phone screenshots. Take them from a real device, not from the in-game simulator frame
- **Content rating** — the IARC questionnaire. Answer honestly; the stealth-and-dropping mechanic is cartoon slapstick, but read the violence questions carefully
- **Data safety** — after Phase 2 this app makes no network requests and collects nothing. Declare exactly that. It is the easiest form you will ever fill in, and it is a genuine selling point
- **Privacy policy URL** — required even when you collect nothing. A single static page saying so is sufficient
- **Target audience** — if you tick anything under 13, Families policy applies and the bar rises considerably. Consider 13+ for a first release
- **Target API level** — Google requires new apps to target a recent Android API. Capacitor's defaults are usually current; if the console complains, raise `targetSdkVersion` in `android/variables.gradle`

**Check the current testing requirement before you promise anyone a launch date.** Google has required new personal developer accounts to run a closed test with a minimum number of testers for a minimum number of days before production access unlocks. Verify the current rule in the console — it materially changes your timeline and it is the most common surprise for first-time publishers.

### 6.6 Roll out

Internal testing → closed testing → production. Internal testing is available within minutes and is where you should catch everything. Production review for a new account can take several days.

---

## Phase 7 — iOS build and App Store submission

Everything here requires macOS.

### 7.1 Open the project

```bash
npm run build && npx cap sync
npx cap open ios
```

### 7.2 Configure signing

In Xcode, select the **App** target:

- **Signing & Capabilities** → check Automatically manage signing, pick your Team. Xcode creates the certificate and provisioning profile for you
- **General** → confirm the Bundle Identifier is `com.geekatplay.penguinelevator`
- **General** → Version `3.0.0`, Build `1`. The build number must increase on every upload to App Store Connect, same rule as Android's `versionCode`
- **Deployment Info** → portrait only

### 7.3 Declare no encryption

Add to `ios/App/App/Info.plist` to skip the export-compliance questions on every upload:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

### 7.4 Test on a device

Run on a real iPhone, not just the simulator — the simulator does not faithfully reproduce audio unlock behaviour, haptics, or the mute switch. Verify safe areas on a notched device, and that launch shows no white flash.

### 7.5 Archive and upload

1. Set the run destination to **Any iOS Device (arm64)**
2. **Product → Archive**
3. In the Organizer: **Distribute App → App Store Connect → Upload**

Processing takes 10–60 minutes, then the build appears in TestFlight. Install it through TestFlight and play it there before submitting — TestFlight is the real build.

### 7.6 Fill in App Store Connect

- **Screenshots** — required for the largest iPhone sizes. App Store Connect states the exact pixel dimensions it currently wants, and Apple changes them. Add iPad sizes only if you mark the app iPad-compatible
- **App Privacy** — same story as Play: no collection, no tracking. Answer the questionnaire and the nutrition label comes out empty
- **Age rating** — Apple's own questionnaire, separate from IARC
- **Privacy policy URL** — required
- **Review notes** — no login required; say so explicitly to avoid a pointless rejection

### 7.7 Expect guideline 4.2

Apple rejects apps that are "simply a web site bundled as an app". A game is a much stronger position than a content app, and Phase 3 is your defence: works fully offline, no browser chrome, native haptics, proper icon and splash, respects safe areas and the app lifecycle. If you are rejected under 4.2, reply in Resolution Center pointing at those specifics rather than resubmitting unchanged.

Review is typically 24–48 hours.

---

## Phase 8 — The update loop

Every release, in order:

```bash
# 1. bump versions
#    package.json              -> version
#    android/app/build.gradle  -> versionCode (+1) and versionName
#    Xcode target > General    -> Version and Build (+1)

# 2. build and sync
npx tsc --noEmit
npm run build
npx cap sync

# 3. ship
cd android && ./gradlew bundleRelease   # upload the .aab to Play Console
npx cap open ios                        # Product > Archive > Distribute
```

Worth adding to `package.json` now:

```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "mobile": "npm run build && npx cap sync",
  "android": "npm run mobile && npx cap open android",
  "ios": "npm run mobile && npx cap open ios"
}
```

---

## Pre-submit checklist

**Web build**

- [x] No `cdn.tailwindcss.com`, no `fonts.googleapis.com`, no `importmap` in `index.html`
- [x] A full round plays correctly with the network off
- [x] `npx tsc --noEmit` clean
- [x] No `define` block in `vite.config.ts` injecting env vars into the bundle

**Privacy (audited — see "Privacy posture" below)**

- [x] No `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon` in app code
- [x] No analytics, ads, or tracking SDKs in `package.json` or source
- [x] No sharing, messaging, social, leaderboard, or multiplayer features
- [x] No permission usage-description keys in `Info.plist`
- [x] Only one stored value (`penguin-elevator-hs`), on-device, never sent

**Native behaviour**

- [ ] Fake phone bezel disabled on device (`viewMode` forced to `FULLSCREEN`)
- [ ] Header clears the status bar; controls clear the home indicator
- [ ] Locked to portrait
- [ ] High score survives a force-quit
- [ ] Music stops when backgrounded, resumes on return
- [ ] Android back button does something sensible
- [ ] No white flash on cold start

**Store**

- [ ] Icon and splash generated at every density, pixel art still crisp
- [ ] Screenshots taken from a real device
- [ ] Privacy policy live at a public URL
- [ ] Data safety and App Privacy both declare no collection
- [ ] Keystore backed up in two places
- [ ] `versionCode` / build number incremented

---

## Privacy posture

Audited against the full source tree and the built `dist/` bundle. The game is
**fully offline and collects nothing**, which makes the store privacy forms
trivial to fill in honestly.

**Answer "Data Not Collected" for every App Store / Data Safety category.** No
ATT prompt is needed, because there is no tracking to request permission for.

| Area | Status |
|---|---|
| Network requests | None. No `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, or `EventSource` in app code. No API endpoints or CDN references. |
| Assets | All bundled locally — sprites, audio, and both pixel fonts. The game runs in airplane mode. |
| Analytics / ads / tracking | None. No GA, Firebase, Sentry, Mixpanel, AppsFlyer, AdMob, or IDFA. |
| Accounts | None. No login, registration, email, or user profile. |
| Sharing / social | None. No share sheet, clipboard write, leaderboard, friend list, multiplayer, or `mailto:` / `sms:` / deep links. |
| Stored data | Exactly one key, `penguin-elevator-hs`, holding the high-score integer. Written to `UserDefaults` via `@capacitor/preferences` with a `localStorage` fallback. Never transmitted; removed on uninstall. |
| Device identifiers | None. The `uuid` values in `App.tsx` are ephemeral in-memory React keys for penguins — regenerated each session, never persisted or sent. |
| Permissions | None. `Info.plist` declares no `NS*UsageDescription` keys, no URL schemes, no ATS exceptions, and no entitlements file exists. |
| Native plugins | Four, all local-only: App (lifecycle), Haptics, Preferences, SplashScreen. |
| Encryption | `ITSAppUsesNonExemptEncryption` is `false`. |

`@capacitor/core` ships a `CapacitorHttp` implementation inside its bundle, but
it is never imported or invoked, and the plugin is not enabled in
`capacitor.config.ts`. Vite's `modulepreload` polyfill likewise only fetches
same-origin files from the app's own bundle. Neither results in outbound
traffic.

**If you add anything network-facing later** — a leaderboard, ads, crash
reporting, cloud saves — this section, `privacy-policy.md`, and the store
privacy answers must all be updated together before shipping.

---

## Rough timeline

| Stage | Effort |
| --- | --- |
| Phase 2–3, the real work | 1–2 days |
| Phase 4–5, Capacitor and assets | a few hours |
| Android to internal testing | half a day |
| iOS to TestFlight | half a day, once a Mac exists |
| Play production review | days to a week or more for a new account |
| App Store review | 24–48 hours typically |

The long poles are account verification, Google's closed-testing requirement, and getting access to a Mac. Start all three early — they are calendar time, not work.

---

*Penguin Elevator — Geekatplay Studio*
