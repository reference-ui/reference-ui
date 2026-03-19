import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@fixtures/extend-library'

export default defineConfig({
  name: 'reference-unit',
  extends: [baseSystem],
  include: ['src/**/*.{ts,tsx,mdx}'],
  debug: true,
})
