import { join } from 'node:path'
import { getOutDirPath } from '../../../lib/paths'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags'

export interface ResolvedJsxElementsArtifact {
  primitives: string[]
  traced: string[]
  merged: string[]
}

export function normalizeAdditionalJsxElements(names: string[]): string[] {
  const primitiveSet = new Set(PRIMITIVE_JSX_NAMES)

  return [...new Set(names.map((name) => name.trim()).filter((name) => name.length > 0))]
    .filter((name) => !primitiveSet.has(name))
    .sort()
}

export function resolvePandaJsxElements(additionalJsxElements: string[]): string[] {
  return [...PRIMITIVE_JSX_NAMES, ...normalizeAdditionalJsxElements(additionalJsxElements)]
}

export function createResolvedJsxElementsArtifact(
  additionalJsxElements: string[]
): ResolvedJsxElementsArtifact {
  const traced = normalizeAdditionalJsxElements(additionalJsxElements)

  return {
    primitives: [...PRIMITIVE_JSX_NAMES],
    traced,
    merged: resolvePandaJsxElements(traced),
  }
}

export function getResolvedJsxElementsPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'system', 'jsx-elements.json')
}