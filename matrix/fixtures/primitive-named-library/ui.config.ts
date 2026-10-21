/**
 * Primitive-named library fixture: a third-party package built on Reference UI.
 *
 * Topology: prebuilt package ──▶ extend ──▶ User space (see chain T18).
 *
 * The package syncs under its own name and bundles its own generated runtime,
 * so every style prop its components forward mints `primitive-named-library__*`
 * at runtime, whatever the consumer is called. Its `Button` is the generated
 * primitive itself, so the tag a consumer writes spells an own primitive name.
 * There is deliberately NO `jsxElements` list: `Tile` and `Chip` reach the
 * published `jsxElements` / `jsxOwned` by tracing alone.
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'primitive-named-library',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
