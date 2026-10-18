import { defineConfig } from '@reference-ui/core'
import { upstream } from './theme/upstream.ts'

export default defineConfig({
  name: 'core-sync10',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [upstream],
  jsxElements: ['LocalPanel'],
})
