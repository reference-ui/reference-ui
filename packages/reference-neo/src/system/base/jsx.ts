// Resolved JSX element artifact for the generated system folder.
// It takes an extends carrier plus traced wrapper names and emits the
// styletrace input shape. Local is traced union configured, so config
// stays the override: names the tracer misses still land. Primitives come
// from the E1 element vocabulary on the committed shelf, so downstream
// extends consumers read the roster without tracing it.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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

// The E1 vocabulary is the committed shelf the PGEN parity cases gate:
// 101 elements with jsx names. A shelf that cannot be read or parsed
// fails loudly — a silent empty roster would re-darken the discovery
// the feed exists to light.
function readElementName(element: unknown): string {
  if (typeof element !== 'object' || element === null) {
    throw new Error('[jsx] E1 vocabulary.json carries a malformed element')
  }
  const jsx = (element as { jsx?: unknown }).jsx
  if (typeof jsx !== 'string' || jsx.length === 0) {
    throw new Error('[jsx] E1 vocabulary.json carries an element without a jsx name')
  }
  return jsx
}

function readPrimitiveRoster(): string[] {
  const shelf = JSON.parse(
    readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        '..',
        '..',
        'native',
        'generated',
        'primitives',
        'vocabulary.json'
      ),
      'utf-8'
    )
  ) as unknown
  if (typeof shelf !== 'object' || shelf === null) {
    throw new Error('[jsx] E1 vocabulary.json is not an object')
  }
  const elements = (shelf as { elements?: unknown }).elements
  if (!Array.isArray(elements)) {
    throw new Error('[jsx] E1 vocabulary.json carries no elements array')
  }
  return uniqueSorted(elements.map(readElementName))
}

const PRIMITIVE_ROSTER: string[] = readPrimitiveRoster()

export function resolveJsxElements(
  config: ExtendsCarrier,
  traced: readonly string[] = []
): JsxElementsArtifact {
  const upstream = uniqueSorted(
    (config.extends ?? []).flatMap(system => system.jsxElements ?? [])
  )
  const local = uniqueSorted([...(config.jsxElements ?? []), ...traced])
  return {
    primitives: PRIMITIVE_ROSTER,
    upstream,
    local,
    merged: uniqueSorted([...upstream, ...local]),
  }
}
