#!/usr/bin/env node
/**
 * One-command Android release build.
 *
 *   node scripts/release-android.mjs           -> signed .aab (what Play wants)
 *   node scripts/release-android.mjs --apk     -> signed .apk (sideload / testing)
 *   node scripts/release-android.mjs --debug   -> debug .apk, no signing needed
 *   node scripts/release-android.mjs --skip-web -> reuse existing dist/, native only
 *
 * Preflights the things that actually go wrong (JDK version, missing SDK,
 * missing keystore) before burning three minutes on a Gradle run.
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID = join(ROOT, 'android');
const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);

const APK = has('--apk');
const DEBUG = has('--debug');
const SKIP_WEB = has('--skip-web');

const RED = '\x1b[31m', YEL = '\x1b[33m', GRN = '\x1b[32m', DIM = '\x1b[2m', OFF = '\x1b[0m';
const step = (m) => console.log(`\n${GRN}==>${OFF} ${m}`);
const warn = (m) => console.log(`${YEL}!${OFF}  ${m}`);
const die = (m) => { console.error(`\n${RED}x${OFF}  ${m}\n`); process.exit(1); };

const run = (cmd, args, opts = {}) => {
  console.log(`${DIM}$ ${cmd} ${args.join(' ')}${OFF}`);
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: true, ...opts });
};

// ---------------------------------------------------------------- preflight

step('Preflight');

// 1. JDK. Capacitor 8's Android module compiles at source level 21; a JDK 17
//    on PATH fails late with "invalid source release: 21".
const javaHome = process.env.JAVA_HOME;
const javaBin = javaHome ? join(javaHome, 'bin', 'java') : 'java';
let major = 0;
try {
  const v = execSync(`"${javaBin}" -version 2>&1`, { encoding: 'utf8' });
  major = Number((v.match(/version "(\d+)/) || [])[1] || 0);
  console.log(`   JDK ${major} ${javaHome ? `(JAVA_HOME=${javaHome})` : '(from PATH)'}`);
} catch {
  die('No JDK found. Capacitor 8 needs JDK 21 to build the Android project.');
}
if (major < 21) {
  die(
    `JDK ${major} is too old - Capacitor 8's Android module requires JDK 21.\n` +
    `   Install Temurin/Microsoft JDK 21 (or use Android Studio's bundled JBR),\n` +
    `   then point JAVA_HOME at it before re-running:\n\n` +
    `     PowerShell:  $env:JAVA_HOME = "C:\\Program Files\\Eclipse Adoptium\\jdk-21"\n`
  );
}

// 2. Android SDK.
const sdkDir = (() => {
  const lp = join(ANDROID, 'local.properties');
  if (existsSync(lp)) {
    const m = readFileSync(lp, 'utf8').match(/^sdk\.dir=(.+)$/m);
    // local.properties escapes ":" as "\:" - undo that.
    const BS = String.fromCharCode(92);
    if (m) return m[1].trim().split(BS + ":").join(":").split(BS + BS).join(BS);
  }
  return process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || null;
})();
if (!sdkDir || !existsSync(sdkDir)) {
  die('Android SDK not found. Set sdk.dir in android/local.properties or ANDROID_HOME.');
}
console.log(`   Android SDK ${sdkDir}`);

// 3. Signing - only matters for release builds.
if (!DEBUG) {
  const propsFile = join(ANDROID, 'key.properties');
  const fromEnv = process.env.PE_STORE_FILE && process.env.PE_STORE_PASSWORD
    && process.env.PE_KEY_ALIAS && process.env.PE_KEY_PASSWORD;
  if (existsSync(propsFile)) {
    const props = Object.fromEntries(
      readFileSync(propsFile, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
        .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
    const missing = ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'].filter((k) => !props[k]);
    if (missing.length) die(`android/key.properties is missing: ${missing.join(', ')}`);
    if (Object.values(props).some((v) => v === 'CHANGE_ME')) {
      die('android/key.properties still contains CHANGE_ME - fill in the real passwords.');
    }
    const ks = resolve(ANDROID, props.storeFile);
    if (!existsSync(ks)) die(`Keystore not found at ${ks} (storeFile in key.properties).`);
    console.log(`   Signing with ${props.keyAlias} @ ${props.storeFile}`);
  } else if (fromEnv) {
    console.log('   Signing from PE_* environment variables');
  } else {
    die(
      'No signing config. Release builds must be signed or Play will reject them.\n' +
      '   Create a keystore, then copy android/key.properties.example to\n' +
      '   android/key.properties and fill it in. See the release docs.'
    );
  }
}

// 4. Version sanity - versionCode must increase on every Play upload.
const gradle = readFileSync(join(ANDROID, 'app', 'build.gradle'), 'utf8');
const versionCode = (gradle.match(/versionCode\s+(\d+)/) || [])[1];
const versionName = (gradle.match(/versionName\s+"([^"]+)"/) || [])[1];
const pkgVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
console.log(`   versionCode ${versionCode}, versionName ${versionName} (package.json ${pkgVersion})`);
if (versionName && pkgVersion && !pkgVersion.startsWith(versionName)) {
  warn(`versionName "${versionName}" and package.json "${pkgVersion}" disagree - intentional?`);
}

// ------------------------------------------------------------------ build

if (!SKIP_WEB) {
  step('Typecheck');
  run('npm', ['run', 'typecheck']);

  step('Build web assets');
  run('npm', ['run', 'build']);
} else {
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) die('--skip-web given but dist/ is empty.');
  warn('Skipping web build, reusing existing dist/');
}

// Always scope sync to one platform. A bare `npx cap sync` also rewrites
// ios/App/CapApp-SPM/Package.swift with backslash paths on Windows, which
// breaks SwiftPM resolution on the Mac.
step('Sync web assets into the Android project');
run('npx', ['cap', 'sync', 'android']);

const task = DEBUG ? 'assembleDebug' : APK ? 'assembleRelease' : 'bundleRelease';
step(`Gradle ${task}`);
// Absolute path to the Gradle wrapper, quoted for the shell that will run it.
// shell:true means the shell resolves the command, and a POSIX shell (Git Bash,
// WSL) will not find a bare name in cwd - while cmd.exe rejects single quotes.
const isWin = process.platform === 'win32';
const quote = isWin ? '"' : "'";
const gradlew = quote + join(ANDROID, isWin ? 'gradlew.bat' : 'gradlew') + quote;
run(gradlew, [task, '--no-daemon'], { cwd: ANDROID });

// ----------------------------------------------------------------- report

const artifact = DEBUG
  ? join(ANDROID, 'app/build/outputs/apk/debug/app-debug.apk')
  : APK
    ? join(ANDROID, 'app/build/outputs/apk/release/app-release.apk')
    : join(ANDROID, 'app/build/outputs/bundle/release/app-release.aab');

if (!existsSync(artifact)) die(`Gradle finished but ${artifact} is missing.`);

const mb = (statSync(artifact).size / 1024 / 1024).toFixed(2);
console.log(`\n${GRN}Done.${OFF} ${artifact}  (${mb} MB)`);
if (!DEBUG && !APK) {
  console.log(`\nUpload this .aab at Play Console > Testing or Production > Create new release.`);
  console.log(`Remember to bump versionCode in android/app/build.gradle before the next upload.`);
}
