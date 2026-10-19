// ui.config.ts — sync config for the TOKEN-02 world: 'core-token2' over theme/**/*.{ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-token2',
  include: ['theme/**/*.{ts,tsx}'],
})
