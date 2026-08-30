import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      include: /\.(js|jsx)$/,
    }),
  ],

  oxc: {
    include: /src\/.*\.(js|jsx)$/,
    jsx: {
      runtime: 'automatic',
    },
  },

  build: {
    outDir: 'build',
  },

  preview: {
    allowedHosts: [
      'expandir-frontend-production.up.railway.app',
      'expandir-terapiaintegrativa.up.railway.app',
    ],
  },
});