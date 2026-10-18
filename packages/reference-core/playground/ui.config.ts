// Playground config: the one ui.config.ts the sync and compiler read. It
// takes nothing and default-exports defineConfig with the project name and
// the include glob over src/**/*.{ts,tsx} — the only two knobs this world
// needs. The include glob is what bounds static extraction, so styles are
// read from source and nowhere else.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'playground',
  include: ['src/**/*.{ts,tsx}'],
})
