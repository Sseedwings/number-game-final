import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel 환경 변수가 없을 때를 대비한 안전한 문자열 주입
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // 라이브러리 호환성을 위한 process 객체 정의
    'process': {
      env: {
        API_KEY: JSON.stringify(process.env.API_KEY || ''),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production')
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
});