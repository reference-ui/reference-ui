import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'

export default defineConfig({
  name: '01-dashboard',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
})
