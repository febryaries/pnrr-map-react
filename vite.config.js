import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile()
  ],
  server: {
    proxy: {
      '/api/mfe': {
        target: 'https://mfe.gov.ro',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mfe/, ''),
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    assetsInlineLimit: 100000000, // 100MB - inline everything
    chunkSizeWarningLimit: 1000
  }
})
