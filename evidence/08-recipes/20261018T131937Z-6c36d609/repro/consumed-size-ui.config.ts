import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'

// Copy to ui.config.ts to run only the minimal wrapper/control fixture.
export default defineConfig({
  name: '08-recipes',
  include: ['repro/consumed-size-prop.tsx'],
  extends: [baseSystem],
})
