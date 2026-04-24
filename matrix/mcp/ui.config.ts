import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'mcp',
  include: ['src/**/*.tsx'],
  mcp: {
    include: ['src/**/*.tsx'],
    exclude: ['**/node_modules/**', '.reference-ui/**', 'tests/**'],
  },
  debug: true,
})