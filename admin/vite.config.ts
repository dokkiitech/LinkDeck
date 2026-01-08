import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  preview: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: ['.linksdeck.app'],
  },
  build: {
    outDir: 'dist',
  },
});
