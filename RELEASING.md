# Releasing Penguin Elevator

Current release: **2.1** — Android `versionCode 6`, iOS build `5`.

## Versioning

`package.json` `"version"` is the single source of truth. Vite injects it into
the bundle (`__APP_VERSION__`), so `constants.ts` and the `<meta name="version">`
tag in `index.html` both follow it automatically — never retype a version in
either of those files.

Three numbers still have to be bumped by hand for each release:

| File | Field | Rule |
|---|---|---|
| `package.json` | `version` | The marketing version, e.g. `2.1.0` |
| `android/app/build.gradle` | `versionCode` | **Must strictly increase** on every Play upload |
| `android/app/build.gradle` | `versionName` | Match `package.json`, e.g. `"2.1"` |
| `ios/App/App.xcodeproj/project.pbxproj` | `MARKETING_VERSION` | Match `package.json` (both Debug and Release) |
| `ios/App/App.xcodeproj/project.pbxproj` | `CURRENT_PROJECT_VERSION` | **Must strictly increase** for a given marketing version |

`scripts/release-android.mjs` warns if `versionName` and `package.json` disagree.

## Android → Google Play

Needs **JDK 21** and the Android SDK. Signing comes from `android/key.properties`
(gitignored); see `android/key.properties.example`.

```bash
npm run android:bundle
```

That typechecks, builds the web assets, runs `cap sync android`, and produces a
signed bundle at `android/app/build/outputs/bundle/release/app-release.aab`.

Then in the Play Console: **Testing → Internal testing** (or **Production**) →
*Create new release* → upload the `.aab` → fill in release notes → roll out.

To sideload the exact release build for a last check before uploading:

```bash
npm run android:apk
```

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## iOS → App Store

Requires macOS with Xcode 26 or newer and the iOS 26 SDK. From a fresh
`git pull` on the Mac:

```bash
npm ci
npm run typecheck
npm run ios
```

In Xcode: select **Any iOS Device (arm64)** as the destination, then
*Product → Archive*. In Organizer, run *Validate App* before
*Distribute App → App Store Connect → Upload*, then test the processed build
through TestFlight.

Confirm before archiving that the **General** tab shows Version `2.1` and Build
`5`. If App Store Connect still shows an older version after upload, the archive
was built from stale settings — clean the build folder and re-archive.

## Store privacy answers

Both stores must be answered as **"Data Not Collected"** in every category. The
app makes no network requests, has no accounts, and stores only the player's own
high score and best floor locally.

* **Apple** — App Privacy → *Data Not Collected*. `ios/App/App/PrivacyInfo.xcprivacy`
  declares no tracking, no collected data types, and the one required-reason API
  the app uses (`NSPrivacyAccessedAPICategoryUserDefaults`, reason `CA92.1`, for
  saving the local high score).
* **Google Play** — Data safety → *No data collected*, *No data shared*.
* Public policy URL: [privacy-policy.md](privacy-policy.md).

## Pre-submission checklist

- [ ] `npm run typecheck` clean
- [ ] Versions bumped per the table above
- [ ] Release notes written for both stores
- [ ] Screenshots current (iPhone 6.9" is the only required size — the iOS
      target is `TARGETED_DEVICE_FAMILY = 1`, iPhone only, so no iPad set is asked for)
- [ ] Played through on a real device from the signed release build, not a debug one
- [ ] `privacy-policy.md` still matches what the app actually does

## Permissions the shipped app holds

iOS requests nothing. Android declares **`VIBRATE` only**, for drop haptics —
`INTERNET` is deliberately *not* declared, so the app cannot reach the network
even in principle. Keep it that way: adding a CDN script, a Google Fonts link,
or any SDK that phones home would require re-declaring `INTERNET` and would
invalidate every privacy answer above.
