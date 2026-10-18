// Core config for the LAYER-04 world. It takes no input and emits the system
// name plus the fragment include globs, leaving normalizeCss at its default
// so the served sync ships the reset layer the spec asserts.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layer4',
  include: ['theme/**/*.{ts,tsx}'],
})
