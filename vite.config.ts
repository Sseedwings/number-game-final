import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel 환경 변수가 빌드 타임에 주입되도록 설정
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // 브라우저 런타임에서 process.env 참조 에러를 방지하기 위한 전역 shim
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || ''),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production')
    }
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