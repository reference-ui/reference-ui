import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@fixtures/extend-library/baseSystem'

export default defineConfig({
  name: 'reference-e2e',
  include: ['**/*.{ts,tsx}'],
  debug: false,
  skipTypescript: true,
  extends: [baseSystem],
})
