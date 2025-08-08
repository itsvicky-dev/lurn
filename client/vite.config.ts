import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-static-files',
      apply: 'build',
      closeBundle: () => {
        // Copy _redirects file
        const redirectsSrc = resolve(__dirname, 'public', '_redirects');
        const redirectsDest = resolve(__dirname, 'dist', '_redirects');
        fs.copyFileSync(redirectsSrc, redirectsDest);
        console.log('✅ _redirects file copied to dist/');

        // Copy _headers file if it exists
        const headersSrc = resolve(__dirname, 'public', '_headers');
        const headersDest = resolve(__dirname, 'dist', '_headers');
        if (fs.existsSync(headersSrc)) {
          fs.copyFileSync(headersSrc, headersDest);
          console.log('✅ _headers file copied to dist/');
        }

        // Copy netlify.toml file if it exists
        const netlifyTomlSrc = resolve(__dirname, 'public', 'netlify.toml');
        const netlifyTomlDest = resolve(__dirname, 'dist', 'netlify.toml');
        if (fs.existsSync(netlifyTomlSrc)) {
          fs.copyFileSync(netlifyTomlSrc, netlifyTomlDest);
          console.log('✅ netlify.toml file copied to dist/');
        }

        // Copy index.html as 404.html for SPA routing fallback
        const indexSrc = resolve(__dirname, 'dist', 'index.html');
        const notFoundDest = resolve(__dirname, 'dist', '404.html');
        if (fs.existsSync(indexSrc)) {
          fs.copyFileSync(indexSrc, notFoundDest);
          console.log('✅ 404.html file created from index.html');
        }

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
