import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'

export default defineConfig({
  name: '16-brand-launch',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  strict: ['colors', 'radii', 'spacing'],
})
