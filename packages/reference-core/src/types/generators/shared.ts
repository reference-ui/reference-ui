/**
 * Shared file-path helpers for type-graph generators.
 *
 * Generators MUST derive output locations from these helpers so the layout of
 * the consumer's generated `@reference-ui/system` and `@reference-ui/react`
 * packages stays in lockstep with what the packager seeds.
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { getOutDirPath } from '../../lib/paths'

export const FONT_REGISTRY_FILENAME = 'font-registry.json'

/** Directory the unconsumed `system` artefacts (font registry, generated types) live in. */
export function getSystemTypesDir(cwd: string): string {
  return join(getOutDirPath(cwd), 'system')
}

export function getSystemFontRegistryPath(cwd: string): string {
  return join(getSystemTypesDir(cwd), FONT_REGISTRY_FILENAME)
}

export function getSystemGeneratedTypesPath(cwd: string): string {
  return join(getSystemTypesDir(cwd), 'types.generated.d.mts')
}

/**
 * Resolve a sibling `.d.ts` of an emitted package's root types entry.
 *
 * Public-type modules ship under `types/public/`; this helper hides that layout
 * so callers do not have to know whether a package emitted split declarations.
 */
export function getPublicSiblingDeclarationPath(
  typesPath: string,
  basename: string
): string | undefined {
  const candidate = join(dirname(typesPath), 'types', 'public', `${basename}.d.ts`)
  return existsSync(candidate) ? candidate : undefined
}
