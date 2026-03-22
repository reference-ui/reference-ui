import type { ReferenceTokenConfig, ReferenceTokenLeaf } from '../../../../api/tokens'
import { deepMerge } from './runtime'

/**
 * Token mode truth table:
 * - `value` -> emit a base token only
 * - `light` -> treat `light` as the base token and emit a light theme token
 * - `dark` -> treat `dark` as the base token and emit a dark theme token
 * - `value + dark` -> treat `value` as the default/light token, emit an explicit light theme token, plus a dark override
 * - `value + light` -> treat `value` as the default/dark token, emit an explicit dark theme token, plus a light override
 * - `light + dark` -> emit explicit light and dark theme tokens, with no base token
 * - `value + light + dark` -> prefer the explicit `light + dark` pair and ignore `value`
 */
type PandaTokenTree = Record<string, unknown>
type ThemeName = 'light' | 'dark'
type ThemeTokenTree = Record<ThemeName, PandaTokenTree>

export interface ResolvedColorModeTokens {
  baseTokens: PandaTokenTree
  themes: Record<string, { tokens: PandaTokenTree }>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isReferenceTokenLeaf(value: unknown): value is ReferenceTokenLeaf {
  return isPlainObject(value) && ('value' in value || 'light' in value || 'dark' in value)
}

function stripModeOverrides(token: ReferenceTokenLeaf): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(token).filter(([key]) => key !== 'light' && key !== 'dark')
  )
}

function hasKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).length > 0
}

function createThemeLeaf(
  baseLeaf: Record<string, unknown>,
  modeValue: unknown
): Record<string, unknown> {
  return {
    ...baseLeaf,
    value: modeValue,
  }
}

type NormalizedTokenParts = {
  baseNode: Record<string, unknown>
  themeNodes: Partial<ThemeTokenTree>
}

function normalizeLeafTokenNode(node: ReferenceTokenLeaf): NormalizedTokenParts {
  const tokenFields = stripModeOverrides(node)
  const themeNodes: Partial<ThemeTokenTree> = {}
  const hasExplicitPair = node.light !== undefined && node.dark !== undefined
  const hasValue = node.value !== undefined
  const baseValue = hasExplicitPair
    ? undefined
    : node.value ?? node.light ?? node.dark
  const baseNode = baseValue !== undefined
    ? { ...tokenFields, value: baseValue }
    : {}

  if (node.light !== undefined) {
    themeNodes.light = createThemeLeaf(tokenFields, node.light)
  } else if (hasValue && node.dark !== undefined) {
    themeNodes.light = createThemeLeaf(tokenFields, node.value)
  }

  if (node.dark !== undefined) {
    themeNodes.dark = createThemeLeaf(tokenFields, node.dark)
  } else if (hasValue && node.light !== undefined) {
    themeNodes.dark = createThemeLeaf(tokenFields, node.value)
  }

  return {
    baseNode,
    themeNodes,
  }
}

function mergeChildIntoParentThemes(
  themeNodes: Partial<ThemeTokenTree>,
  key: string,
  child: NormalizedTokenParts
): void {
  if (child.themeNodes.light && hasKeys(child.themeNodes.light)) {
    const lightNode = themeNodes.light ?? {}
    lightNode[key] = child.themeNodes.light
    themeNodes.light = lightNode
  }

  if (child.themeNodes.dark && hasKeys(child.themeNodes.dark)) {
    const darkNode = themeNodes.dark ?? {}
    darkNode[key] = child.themeNodes.dark
    themeNodes.dark = darkNode
  }
}

function normalizeObjectTokenNode(node: ReferenceTokenConfig): NormalizedTokenParts {
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

    mergeChildIntoParentThemes(themeNodes, key, normalizedChild)
  }

  return { baseNode, themeNodes }
}

function normalizeTokenNode(node: ReferenceTokenConfig | ReferenceTokenLeaf): NormalizedTokenParts {
  if (isReferenceTokenLeaf(node)) {
    return normalizeLeafTokenNode(node)
  }

  return normalizeObjectTokenNode(node)
}

export function resolveColorModeTokens(
  fragments: ReferenceTokenConfig[]
): ResolvedColorModeTokens {
  const resolved: ResolvedColorModeTokens = {
    baseTokens: {},
    themes: {},
  }

  for (const fragment of fragments) {
    const { baseNode, themeNodes } = normalizeTokenNode(fragment)

    resolved.baseTokens = deepMerge({}, resolved.baseTokens, baseNode)

    if (themeNodes.light && hasKeys(themeNodes.light)) {
      resolved.themes.light = {
        tokens: deepMerge(
          {},
          resolved.themes.light?.tokens ?? {},
          themeNodes.light
        ),
      }
    }

    if (themeNodes.dark && hasKeys(themeNodes.dark)) {
      resolved.themes.dark = {
        tokens: deepMerge(
          {},
          resolved.themes.dark?.tokens ?? {},
          themeNodes.dark
        ),
      }
    }
  }

  return resolved
}
