/**
 * Sync config for the MCP matrix package. Extends the lib `baseSystem` plus
 * `@fixtures/extend-library`, whose `colors._private` subtree lets the
 * tool suites prove private tokens never leak to downstream consumers.
 * The `mcp` key scopes tool file access to `src`, excluding build output and tests.
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'
import { baseSystem as extendLibrary } from '@fixtures/extend-library/baseSystem'

export default defineConfig({
  name: 'mcp',
  include: ['src/**/*.{ts,tsx}'],
  // extend-library is included so MCP-surface tests can verify that
  // upstream `_private` token subtrees never leak through `get_tokens`
  // to a downstream consumer (`@fixtures/extend-library` ships
  // `colors._private.brand`).
  extends: [baseSystem, extendLibrary],
  mcp: {
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['**/node_modules/**', '.reference-ui/**', 'tests/**'],
  },
  debug: false,
})