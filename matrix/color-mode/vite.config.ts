/*
 * This file is generated and managed by pipeline.
 */
import { referenceVite } from '@reference-ui/core'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    referenceVite(),
    {
      name: 'reference-ui:matrix-vite-entry',
      transformIndexHtml(html) {
        if (html.includes('/src/main.tsx')) return html
        return html.replace('</body>', '    <script type="module" src="/src/main.tsx"></script>\n  </body>')
      },
    },
  ],
})
