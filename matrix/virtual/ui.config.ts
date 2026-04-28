import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'virtual',
  include: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
  extends: [baseSystem],
  debug: false,
})