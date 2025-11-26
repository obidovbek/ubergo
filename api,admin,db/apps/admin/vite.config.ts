import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 3001,
    },
    // Proxy API requests to backend in development
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy uploads to backend to avoid CORS issues in development
      '/uploads': {
        target: process.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
        // Preserve the original path
        rewrite: (path) => path,
        // Handle errors
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Log proxy responses in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
            }
          });
        },
      },
    },
  },
});
