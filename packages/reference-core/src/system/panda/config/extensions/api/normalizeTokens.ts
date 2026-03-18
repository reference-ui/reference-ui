import type { ReferenceTokenConfig, ReferenceTokenLeaf } from '../../../../api/tokens'
import { deepMerge } from './runtime'

type PandaTokenTree = Record<string, unknown>
type ThemeName = 'light' | 'dark'
type ThemeTokenTree = Record<ThemeName, PandaTokenTree>

export interface NormalizedTokenFragments {
  baseTokens: PandaTokenTree
  themes: Record<string, { tokens: PandaTokenTree }>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isReferenceTokenLeaf(value: unknown): value is ReferenceTokenLeaf {
  return isPlainObject(value) && 'value' in value
}

function stripModeOverrides(token: ReferenceTokenLeaf): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(token).filter(([key]) => key !== 'light' && key !== 'dark')
  )
}

function hasKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).length > 0
}

function normalizeTokenNode(node: ReferenceTokenConfig | ReferenceTokenLeaf): {
  baseNode: Record<string, unknown>
  themeNodes: Partial<ThemeTokenTree>
} {
  if (isReferenceTokenLeaf(node)) {
    const baseLeaf = stripModeOverrides(node)
    const themeNodes: Partial<ThemeTokenTree> = {}

    if (node.light !== undefined) {
      themeNodes.light = {
        ...baseLeaf,
        value: node.light,
      }
    }

    if (node.dark !== undefined) {
      themeNodes.dark = {
        ...baseLeaf,
        value: node.dark,
      }
    }

    return {
      baseNode: baseLeaf,
      themeNodes,
    }
  }

  const baseNode: Record<string, unknown> = {}
  const themeNodes: Partial<ThemeTokenTree> = {}

  for (const [key, value] of Object.entries(node)) {
    if (!isPlainObject(value)) {
      continue
    }

    const normalizedChild = normalizeTokenNode(value as ReferenceTokenConfig | ReferenceTokenLeaf)

    if (hasKeys(normalizedChild.baseNode)) {
      baseNode[key] = normalizedChild.baseNode
    }

    if (normalizedChild.themeNodes.light && hasKeys(normalizedChild.themeNodes.light)) {
      const lightNode = themeNodes.light ?? {}
      lightNode[key] = normalizedChild.themeNodes.light
      themeNodes.light = lightNode
    }

    if (normalizedChild.themeNodes.dark && hasKeys(normalizedChild.themeNodes.dark)) {
      const darkNode = themeNodes.dark ?? {}
      darkNode[key] = normalizedChild.themeNodes.dark
      themeNodes.dark = darkNode
    }
  }

  return { baseNode, themeNodes }
}

export function normalizeTokenFragments(
  fragments: ReferenceTokenConfig[]
): NormalizedTokenFragments {
  const normalized: NormalizedTokenFragments = {
    baseTokens: {},
    themes: {},
  }

  for (const fragment of fragments) {
    const { baseNode, themeNodes } = normalizeTokenNode(fragment)

    normalized.baseTokens = deepMerge({}, normalized.baseTokens, baseNode)

    if (themeNodes.light && hasKeys(themeNodes.light)) {
      normalized.themes.light = {
        tokens: deepMerge(
          {},
          normalized.themes.light?.tokens ?? {},
          themeNodes.light
        ),
      }
    }

    if (themeNodes.dark && hasKeys(themeNodes.dark)) {
      normalized.themes.dark = {
        tokens: deepMerge(
          {},
          normalized.themes.dark?.tokens ?? {},
          themeNodes.dark
        ),
      }
    }
  }

  return normalized
}
