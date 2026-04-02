import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isElectron = process.env.ELECTRON === 'true';
  
  return {
    base: isElectron ? './' : '/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      watch: {
        ignored: ['**/server/data/**', '**/src-tauri/**'],
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // 对于 multipart/form-data，移除 content-length 让 Go 自己处理
              const contentType = req.headers['content-type'] || '';
              if (contentType.includes('multipart/form-data')) {
                proxyReq.removeHeader('content-length');
              }
            });
          },
        },
        '/uploads': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
