import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      apply: 'build',
      closeBundle: () => {
        const src = resolve(__dirname, 'public', '_redirects');
        const dest = resolve(__dirname, 'dist', '_redirects');
        fs.copyFileSync(src, dest);
        console.log('✅ _redirects file copied to dist/');
      },
    },
  ],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
