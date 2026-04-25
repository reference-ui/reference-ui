import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'mcp',
  include: ['src/**/*.{ts,tsx}'],
  mcp: {
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['**/node_modules/**', '.reference-ui/**', 'tests/**'],
  },
  debug: true,
})