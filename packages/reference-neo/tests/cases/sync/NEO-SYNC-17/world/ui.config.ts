import { defineConfig } from '@reference-ui/neo'
import { upstream } from './theme/upstream.ts'

export default defineConfig({
  name: 'neo-sync17',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [upstream],
})
