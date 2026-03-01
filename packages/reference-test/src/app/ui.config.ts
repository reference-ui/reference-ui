import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'reference-test',
  include: ['**/*.{ts,tsx}'],
  debug: true,
  skipTypescript: true,
})
