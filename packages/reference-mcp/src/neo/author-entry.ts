// Neo author-entry resolution for mcp-side esbuild alias maps.
// It takes nothing and emits the absolute author file bundling aliases to.
// Neo computes this path from `import.meta.url`, which breaks once Neo
// modules are bundled into mcp dist (F4); mcp resolves it explicitly:
// the shipped `neo-author.mjs` dist sibling first, the Neo source entry
// as the dev/vitest fallback. Both candidates are existsSync-gated.

import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Module ids that mark a file as a token-fragment source when imported. */
export const MCP_FRAGMENT_NEEDLES = [
  '@reference-ui/neo',
  '@reference-ui/neo/config',
  '@reference-ui/system',
  '@reference-ui/core/config',
  '@reference-ui/cli/config',
]

/**
 * Resolve the Neo author entry for esbuild alias maps.
 * Shipped layout: `dist/neo-author.mjs` next to the bundled chunk.
 * Dev/vitest: Neo's source author entry inside the monorepo.
 */
export function resolveNeoAuthorEntry(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    resolve(here, 'neo-author.mjs'),
    resolve(here, '../../../reference-neo/src/author/index.ts'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  throw new Error(
    `mcp: Neo author entry not found. Tried:\n${candidates.map(c => `  - ${c}`).join('\n')}`
  )
}

/** Alias map pointing fragment/config module ids at the author entry. */
export function getNeoAuthorImportMap(ids: readonly string[]): Record<string, string> {
  const entry = resolveNeoAuthorEntry()
  return Object.fromEntries(ids.map(id => [id, entry]))
}

/** Alias map for token-fragment bundles (fragment needle ids). */
export function getMcpFragmentImportMap(): Record<string, string> {
  return getNeoAuthorImportMap(MCP_FRAGMENT_NEEDLES)
}
