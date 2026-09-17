// Resolved JSX element artifact for the generated system folder.
// It takes the Neo config and emits the styletrace input shape.
// Primitives stay empty: extraction recognizes hosts from file-local
// imports, so the generator never feeds this artifact.

import type { ReferenceUIConfig } from '../config/types.ts'

export interface JsxElementsArtifact {
  primitives: string[]
  upstream: string[]
  local: string[]
  merged: string[]
}

function uniqueSorted(names: string[]): string[] {
  return [...new Set(names.map(name => name.trim()).filter(name => name.length > 0))].sort()
}

export function resolveJsxElements(config: ReferenceUIConfig): JsxElementsArtifact {
  const upstream = uniqueSorted(
    (config.extends ?? []).flatMap(system => system.jsxElements ?? [])
  )
  const local = uniqueSorted(config.jsxElements ?? [])
  return {
    primitives: [],
    upstream,
    local,
    merged: uniqueSorted([...upstream, ...local]),
  }
}
