// Resolved JSX element artifact for the generated system folder.
// It takes an extends carrier plus traced wrapper names and emits the
// styletrace input shape. Local is traced union configured, so config
// stays the override: names the tracer misses still land. Primitives stay
// empty: extraction recognizes hosts from file-local imports, so the
// generator never feeds this artifact.

import type { ExtendsCarrier } from './types.ts'

export interface JsxElementsArtifact {
  primitives: string[]
  upstream: string[]
  local: string[]
  merged: string[]
}

function uniqueSorted(names: string[]): string[] {
  return [...new Set(names.map(name => name.trim()).filter(name => name.length > 0))].sort()
}

export function resolveJsxElements(
  config: ExtendsCarrier,
  traced: readonly string[] = []
): JsxElementsArtifact {
  const upstream = uniqueSorted(
    (config.extends ?? []).flatMap(system => system.jsxElements ?? [])
  )
  const local = uniqueSorted([...(config.jsxElements ?? []), ...traced])
  return {
    primitives: [],
    upstream,
    local,
    merged: uniqueSorted([...upstream, ...local]),
  }
}
