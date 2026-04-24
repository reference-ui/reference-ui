import { baseSystem } from '@reference-ui/lib'
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'typescript',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  debug: true,
})