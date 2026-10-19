import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'

export default defineConfig({
  name: '15-locale-checkout',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
})
