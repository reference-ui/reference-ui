// Core author-entry resolution for mcp-side esbuild alias maps.
// It takes nothing and emits the absolute author file bundling aliases to.
// Core computes this path from `import.meta.url`, which breaks once Core
// modules are bundled into mcp dist; mcp resolves it explicitly:
// the shipped `core-author.mjs` dist sibling first, the Core source entry
// as the dev/vitest fallback. Both candidates are existsSync-gated.

import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Module ids that mark a file as a token-fragment source when imported. */
export const MCP_FRAGMENT_NEEDLES = [
  '@reference-ui/core',
  '@reference-ui/core/config',
  '@reference-ui/system',
  // Retired cli ids stay so older user fragments are found; mirrors core's needles.
  '@reference-ui/cli/config',
]

/**
 * Resolve the Core author entry for esbuild alias maps.
 * Shipped layout: `dist/core-author.mjs` next to the bundled chunk.
 * Dev/vitest: Core's source author entry inside the monorepo.
 */
export function resolveCoreAuthorEntry(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    resolve(here, 'core-author.mjs'),
    resolve(here, '../../../reference-core/src/index.ts'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  throw new Error(
    `mcp: Core author entry not found. Tried:\n${candidates.map(c => `  - ${c}`).join('\n')}`
  )
}

/** Alias map pointing fragment/config module ids at the author entry. */
export function getCoreAuthorImportMap(ids: readonly string[]): Record<string, string> {
  const entry = resolveCoreAuthorEntry()
  return Object.fromEntries(ids.map(id => [id, entry]))
}

/** Alias map for token-fragment bundles (fragment needle ids). */
export function getMcpFragmentImportMap(): Record<string, string> {
  return getCoreAuthorImportMap(MCP_FRAGMENT_NEEDLES)
}
