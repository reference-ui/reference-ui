/**
 * T18 sync leg: icons composed. `@reference-ui/icons/baseSystem` sits in
 * `layers`, so the icons qualifier exists and a style prop on an icon is
 * backed under `reference-icons__` with no `ATM-W-EXTERNAL-UNBACKED`.
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem as iconsSystem } from '@reference-ui/icons/baseSystem'

export default defineConfig({
  name: 'chain-t18-icons-backed',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  layers: [iconsSystem],
  debug: false,
})
