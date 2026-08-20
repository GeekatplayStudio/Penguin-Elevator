import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
