// ui.config.ts — sync config for the SYNC-10 world: 'core-sync10' over theme/**/*.{ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'
import { upstream } from './theme/upstream.ts'

export default defineConfig({
  name: 'core-sync10',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [upstream],
  jsxElements: ['LocalPanel'],
})
