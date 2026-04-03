import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // @reference-ui packages are symlinked to .reference-ui/ in the project
      // root, so the packager can update them at any time. Un-exclude them from
      // the default node_modules ignore so Vite invalidates and re-serves their
      // CSS when tokens change during ref sync --watch.
      ignored: (path: string) =>
        path.includes('node_modules') && !path.includes('@reference-ui'),
    },
  },
})
