import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'mcp',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  mcp: {
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['**/node_modules/**', '.reference-ui/**', 'tests/**'],
  },
  debug: true,
})