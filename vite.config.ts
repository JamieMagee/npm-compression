import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  optimizeDeps: {
    exclude: [
      '@bokuweb/zstd-wasm',
      'brotli-wasm'
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
