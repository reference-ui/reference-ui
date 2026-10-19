// Bare Vite + React config for the consumer-smoke scaffold.
// It takes the packed tarball via file: link and emits a plain production build, proving the
// documented consumer path works with no aliases or tribal setup.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
})
