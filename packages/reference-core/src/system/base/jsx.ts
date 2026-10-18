// Resolved JSX element artifact for the generated system folder.
// It takes an extends carrier plus traced wrapper names and owned props and
// emits the styletrace input shape. Local is traced union configured, so
// config stays the override: names the tracer misses still land. Owned prop
// names ride beside the roster as a component-to-props map that prints only
// when it names a prop. Primitives come from the element vocabulary on the
// committed shelf, so downstream extends consumers read the roster without
// tracing it.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ExtendsCarrier } from './types.ts'

export interface JsxElementsArtifact {
  primitives: string[]
  upstream: string[]
  local: string[]
  merged: string[]
  /** Prop names each component keeps for itself, by component: upstream (extends and layers) joined with local traced. */
  owned: Record<string, string[]>
}

type OwnedProps = Readonly<Record<string, readonly string[]>>

function uniqueSorted(names: readonly string[]): string[] {
  return [...new Set(names.map(name => name.trim()).filter(name => name.length > 0))].sort()
}

// Every source's props, gathered under the trimmed component name.
function groupOwned(sources: ReadonlyArray<OwnedProps | undefined>): Map<string, string[]> {
  const propsByComponent = new Map<string, string[]>()
  for (const source of sources) {
    for (const [component, props] of Object.entries(source ?? {})) {
      const name = component.trim()
      propsByComponent.set(name, [...(propsByComponent.get(name) ?? []), ...props])
    }
  }
  return propsByComponent
}

// Joins owned maps by component name: names trimmed, props deduped and sorted, keys sorted, and a
// component left with no prop dropped, so the same inputs always print the same bytes.
function mergeOwned(sources: ReadonlyArray<OwnedProps | undefined>): Record<string, string[]> {
  const grouped = groupOwned(sources)
  const entries = uniqueSorted([...grouped.keys()]).map(
    name => [name, uniqueSorted(grouped.get(name) ?? [])] as const
  )
  return Object.fromEntries(entries.filter(([, props]) => props.length > 0))
}

// The element vocabulary is the committed shelf the PGEN parity cases gate:
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

/** The artifact as printed to jsx-elements.json: `owned` rides only when it names a prop. */
export type PublishedJsxElements = Omit<JsxElementsArtifact, 'owned'> & Partial<Pick<JsxElementsArtifact, 'owned'>>

// An empty owned map is left out, as jsxOwned is from the base system, so a roster without owned
// data keeps the four keys it always printed.
export function publishedJsxElements(artifact: JsxElementsArtifact): PublishedJsxElements {
  const { owned, ...roster } = artifact
  return Object.keys(owned).length > 0 ? artifact : roster
}

/**
 * The names each extended upstream publishes, keyed by system name: the compile request's
 * `upstreamHosts`. The same extends-only source as the artifact's `upstream` bucket, kept by
 * system so the engine can tell them from its own hosts. A system that publishes nothing has no key.
 */
export function upstreamJsxHosts(config: ExtendsCarrier): Record<string, string[]> {
  const bySystem = new Map<string, string[]>()
  for (const system of config.extends ?? []) {
    bySystem.set(system.name, [...(bySystem.get(system.name) ?? []), ...(system.jsxElements ?? [])])
  }
  const entries = [...bySystem.keys()]
    .sort()
    .map(name => [name, uniqueSorted(bySystem.get(name) ?? [])] as const)
  return Object.fromEntries(entries.filter(([, names]) => names.length > 0))
}

export function resolveJsxElements(
  config: ExtendsCarrier,
  traced: readonly string[] = [],
  tracedOwned: OwnedProps = {}
): JsxElementsArtifact {
  // Names come from extends only, because lib's config keeps the JSX roster icons-local. Owned flows
  // through layers on purpose, and only owned does: a layered component keeps its own props too.
  const upstream = uniqueSorted(
    (config.extends ?? []).flatMap(system => system.jsxElements ?? [])
  )
  const local = uniqueSorted([...(config.jsxElements ?? []), ...traced])
  const upstreamOwned = [...(config.extends ?? []), ...(config.layers ?? [])].map(
    system => system.jsxOwned
  )
  return {
    primitives: PRIMITIVE_ROSTER,
    upstream,
    local,
    merged: uniqueSorted([...upstream, ...local]),
    owned: mergeOwned([...upstreamOwned, tracedOwned]),
  }
}
