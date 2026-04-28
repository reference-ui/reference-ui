import { referenceVite } from '@reference-ui/core'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), referenceVite()],
})