import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@fixtures/extend-library'

export default defineConfig({
  name: 'reference-e2e',
  include: ['**/*.{ts,tsx}'],
  debug: true,
  skipTypescript: true,
  extends: [baseSystem],
})
