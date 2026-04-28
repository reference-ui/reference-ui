import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'css',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  debug: false,
})