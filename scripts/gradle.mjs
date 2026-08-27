#!/usr/bin/env node
/**
 * Thin passthrough to the Android project's Gradle wrapper, so npm scripts do
 * not have to care about gradlew vs gradlew.bat or about cd-ing first.
 *
 *   node scripts/gradle.mjs clean
 *   node scripts/gradle.mjs installDebug
 */
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ANDROID = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'android');
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/gradle.mjs <gradle-task> [...]');
  process.exit(1);
}

// Absolute path to the Gradle wrapper, quoted for the shell that will run it.
// shell:true means the shell resolves the command, and a POSIX shell (Git Bash,
// WSL) will not find a bare name in cwd - while cmd.exe rejects single quotes.
const isWin = process.platform === 'win32';
const quote = isWin ? '"' : "'";
const gradlew = quote + join(ANDROID, isWin ? 'gradlew.bat' : 'gradlew') + quote;
try {
  execFileSync(gradlew, args, { cwd: ANDROID, stdio: 'inherit', shell: true });
} catch (err) {
  process.exit(err.status ?? 1);
}
