/**
 * T18 sync leg: partly composed, the twin of the T18 app. It extends lib but
 * NOT `@fixtures/primitive-named-library`, so the fixture's tags render
 * through a system this compile cannot back. Each styled fixture tag warns
 * `ATM-W-EXTERNAL-UNBACKED` once, naming the package and its system, and its
 * props back under nothing: not under lib's systems, not under this app's.
 * The lib tag beside them is backed as usual (the sheet is not empty).
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem as libSystem } from '@reference-ui/lib/baseSystem'

export default defineConfig({
  name: 'chain-t18-partial',
  include: ['src/**/*.{ts,tsx}'],
  extends: [libSystem],
  layers: [],
})
