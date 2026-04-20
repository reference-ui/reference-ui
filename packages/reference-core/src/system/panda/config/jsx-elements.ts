import { join } from 'node:path'
import type { BaseSystem } from '../../../types'
import { getOutDirPath } from '../../../lib/paths'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags'

export interface ResolvedJsxElementsArtifact {
  primitives: string[]
  upstream: string[]
  local: string[]
  merged: string[]
}

export function normalizeAdditionalJsxElements(names: string[]): string[] {
  const primitiveSet = new Set(PRIMITIVE_JSX_NAMES)

  return [...new Set(names.map((name) => name.trim()).filter((name) => name.length > 0))]
    .filter((name) => !primitiveSet.has(name))
    .sort()
}

export function getUpstreamJsxElements(systems: BaseSystem[] | undefined): string[] {
  return normalizeAdditionalJsxElements(
    (systems ?? []).flatMap((system) => system.jsxElements ?? [])
  )
}

export function resolvePandaJsxElements(additionalJsxElements: string[]): string[] {
  return [...PRIMITIVE_JSX_NAMES, ...normalizeAdditionalJsxElements(additionalJsxElements)]
}

export function createResolvedJsxElementsArtifact(
  options: {
    upstreamJsxElements: string[]
    localJsxElements: string[]
  }
): ResolvedJsxElementsArtifact {
  const upstream = normalizeAdditionalJsxElements(options.upstreamJsxElements)
  const local = normalizeAdditionalJsxElements(options.localJsxElements)
  const merged = normalizeAdditionalJsxElements([...upstream, ...local])

  return {
    primitives: [...PRIMITIVE_JSX_NAMES],
    upstream,
    local,
    merged: resolvePandaJsxElements(merged),
  }
}

export function getResolvedJsxElementsPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'system', 'jsx-elements.json')
}