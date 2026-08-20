import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The game is fully offline and uses no API keys or secrets. Nothing from the
// build environment is injected into the client bundle on purpose - any
// `define` of an env var here would ship that value in plaintext to players.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
