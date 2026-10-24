// Config for the CORE-BOUND-08 world: one include with a paren group.
// Config validation reads it as {a,b}, so it reaches src/a and src/b but not src/c. The spec copies this folder into temp projects, and rewrites ui.config.ts there for the refused legs.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-bound-08',
  include: ['src/(a|b)/*.ts'],
})
