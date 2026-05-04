import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'
import { baseSystem as extendLibrary } from '@fixtures/extend-library'

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