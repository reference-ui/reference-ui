import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'

export default defineConfig({
  name: '04-overlays',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
})
