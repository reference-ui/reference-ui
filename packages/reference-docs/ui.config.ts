import { defineConfig } from '@reference-ui/neo'
import { baseSystem } from '@reference-ui/lib/baseSystem'

export default defineConfig({
  name: 'reference-docs',
  extends: [baseSystem],
  include: ['src/**/*.{ts,tsx,mdx}'],
  normalizeCss: true,
  debug: false,
  mcp: {
    include: ['@reference-ui/lib'],
  },
})
