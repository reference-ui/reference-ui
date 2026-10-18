import { defineConfig } from '@reference-ui/core'
import { upstream } from './theme/upstream.ts'

export default defineConfig({
  name: 'core-sync17',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [upstream],
})
