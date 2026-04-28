import { baseSystem } from '@reference-ui/lib'
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'playwright',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  debug: false,
})