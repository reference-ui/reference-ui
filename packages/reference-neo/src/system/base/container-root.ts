// Upstream container-root scan for the compile request input. It takes
// extends/layers baseSystems with their published streams and emits whether
// any upstream global block roots :root, html, or body with a container type.
// The engine check runs pre-merge and cannot see inherited global CSS, so sync
// carries this verdict on the request and the engine trusts it.
import type { BaseSystem, SystemStreams } from './types.ts'

const ROOT_SELECTORS = new Set([':root', 'html', 'body'])
const CONTAINER_PROPS = ['container-type', 'containerType', 'container']

function declarationsIncludeContainerRoot(declarations: string): boolean {
  return CONTAINER_PROPS.some((prop) =>
    declarations
      .split(';')
      .some((decl) => (decl.split(':')[0] ?? '').trim() === prop)
  )
}

function globalBlockHasRoot(global: string): boolean {
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g
  for (const match of global.matchAll(rulePattern)) {
    const selectors = (match[1] ?? '').split(',').map((selector) => selector.trim())
    if (
      selectors.some((selector) => ROOT_SELECTORS.has(selector)) &&
      declarationsIncludeContainerRoot(match[2] ?? '')
    ) {
      return true
    }
  }
  return false
}

function streamsIncludeRoot(streams: readonly SystemStreams[] | undefined): boolean {
  if (streams == null) return false
  return streams.some((entry) => entry.global != null && globalBlockHasRoot(entry.global))
}

/** True when any upstream system's published global CSS roots a container query scope. */
export function hasUpstreamContainerRoot(systems: readonly BaseSystem[]): boolean {
  return systems.some((system) => streamsIncludeRoot(system.streams))
}
