import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'
export default defineConfig({
  name: 'signal-studio',
  include: ['src/repro/**/*.{ts,tsx}'],
  extends: [baseSystem],
  strict: ['colors', 'radii', 'spacing'],
})
