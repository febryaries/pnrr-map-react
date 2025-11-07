import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { copyFileSync } from 'fs'

export default defineConfig({
  base: '/pnrr-dashboard/',
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'copy-server-configs',
      closeBundle() {
        // Copy server configuration files to dist
        try {
          copyFileSync('.htaccess', 'dist/.htaccess')
          copyFileSync('_redirects', 'dist/_redirects')
          copyFileSync('web.config', 'dist/web.config')
          console.log('✅ Server config files copied to dist/')
        } catch (err) {
          console.warn('⚠️ Could not copy server config files:', err.message)
        }
      }
    }
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
