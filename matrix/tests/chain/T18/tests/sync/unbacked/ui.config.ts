/**
 * T18 sync leg: icons NOT composed. Nothing sits in `extends` or `layers`,
 * so no system can back a style prop on an icon. Sync must still succeed
 * and say so: one `ATM-W-EXTERNAL-UNBACKED` warning at the styled icon,
 * naming `@reference-ui/icons` and the fix (compose its baseSystem).
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'chain-t18-icons-unbacked',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  layers: [],
  debug: false,
})
