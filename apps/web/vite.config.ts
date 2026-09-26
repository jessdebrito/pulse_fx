import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const DEV_SERVER_PORT = 3000;
const DEFAULT_API_PROXY_TARGET = 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: DEV_SERVER_PORT,
    strictPort: true,
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? DEFAULT_API_PROXY_TARGET,
    },
  },
});
