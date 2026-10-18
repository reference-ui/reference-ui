import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'
export default defineConfig({
  name: 'signal-studio',
  include: ['src/repro/main.tsx', 'src/repro/tokens.ts'],
  extends: [baseSystem],
  strict: ['colors', 'radii', 'spacing'],
})
