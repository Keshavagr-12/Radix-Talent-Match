import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/jd-analytics': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
        '/resume-parsing': {
          target: 'http://127.0.0.1:8002',
          changeOrigin: true,
        },
        '/api/auth': {
          target: 'http://127.0.0.1:8003',
          changeOrigin: true,
        },
        '/api/profiles': {
          target: 'http://127.0.0.1:8003',
          changeOrigin: true,
        },
        '/talent-check': {
          target: 'http://127.0.0.1:8004',
          changeOrigin: true,
        },
        '/skill-matching': {
          target: 'http://127.0.0.1:8005',
          changeOrigin: true,
        },
      },
    },
  };
});
