import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vite 빌드 타임에 process.env 객체를 브라우저용으로 치환
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    },
    'global': 'window'
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 3000
  }
});