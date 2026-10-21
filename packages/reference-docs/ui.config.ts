// Sync config for the reference-docs app.
// It extends lib's baseSystem over the docs sources with normalized CSS, and scopes the MCP
// helper to @reference-ui/lib.
import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'

export default defineConfig({
  name: 'reference-docs',
  extends: [baseSystem],
  include: ['src/**/*.{ts,tsx,mdx}'],
  normalizeCss: true,
  mcp: {
    include: ['@reference-ui/lib'],
  },
})
