import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SINGLE SOURCE OF TRUTH for the version string: package.json. It used to be
// retyped in index.html and constants.ts as well, and both drifted - the page
// still advertised "v3.0.0-mobile" while the app rendered v2.0. Everything
// user-visible now derives from this one value at build time.
const APP_VERSION = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')
).version as string;

// Port selection, in order of preference:
//   1. PORT env var, if the launcher assigned one
//   2. DEFAULT_DEV_PORT below
//   3. the next free port after that - `strictPort: false` makes Vite walk
//      upward (3000 -> 3001 -> 3002...) instead of failing when it's taken
const DEFAULT_DEV_PORT = 3000;
const DEFAULT_PREVIEW_PORT = 4173;

const resolvePort = (fallback: number): number => {
  const fromEnv = Number(process.env.PORT);
  return Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv < 65536 ? fromEnv : fallback;
};

// The game is fully offline and uses no API keys or secrets. Nothing from the
// build environment is injected into the client bundle on purpose - any
// `define` of an env var here would ship that value in plaintext to players.
export default defineConfig({
  server: {
    port: resolvePort(DEFAULT_DEV_PORT),
    strictPort: false, // port busy? take the next available one
    host: '0.0.0.0',
  },
  preview: {
    port: resolvePort(DEFAULT_PREVIEW_PORT),
    strictPort: false,
    host: '0.0.0.0',
  },
  define: {
    // consumed by constants.ts
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    {
      // stamps <meta name="version" content="%APP_VERSION%"> in index.html
      name: 'stamp-app-version',
      transformIndexHtml: (html: string) => html.split('%APP_VERSION%').join(APP_VERSION),
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
