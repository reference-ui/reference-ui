import type { ReferenceTokenConfig, ReferenceTokenLeaf } from '../../../../api/tokens'
import { deepMerge } from './runtime'

/**
 * Token mode truth table:
 * - `value` -> emit a base token only
 * - `light` -> treat `light` as the base token and emit a light theme token
 * - `dark` -> treat `dark` as the base token and emit a dark theme token
 * - `value + dark` -> treat `value` as the default/light token, emit an explicit light theme token, plus a dark override
 * - `value + light` -> treat `value` as the default/dark token, emit an explicit dark theme token, plus a light override
 * - `light + dark` -> treat `light` as the base token and emit explicit light and dark theme tokens
 * - `value + light + dark` -> prefer the explicit `light + dark` pair and use `light` as the base token
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

/**
 * Token leaves carry mode slots as `value` and/or `light` / `dark` with **scalar** (typically string) values.
 * If `light` or `dark` is itself a plain object, that key is a **nested group** (e.g. a tier named `light`),
 * not a light-theme color slot — the parent must be normalized as a group.
 */
function isReferenceTokenLeaf(value: unknown): value is ReferenceTokenLeaf {
  if (!isPlainObject(value) || !('value' in value || 'light' in value || 'dark' in value)) {
    return false
  }
  const { light, dark } = value
  if (light !== undefined && isPlainObject(light)) {
    return false
  }
  if (dark !== undefined && isPlainObject(dark)) {
    return false
  }
  return true
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

function getBaseLeafValue(node: ReferenceTokenLeaf): unknown {
  const hasExplicitPair = node.light !== undefined && node.dark !== undefined
  if (hasExplicitPair) return node.light
  return node.value ?? node.light ?? node.dark
}

function getLeafThemeValue(node: ReferenceTokenLeaf, themeName: ThemeName): unknown {
  if (themeName === 'light') {
    if (node.light !== undefined) return node.light
    if (node.value !== undefined && node.dark !== undefined) return node.value
    return undefined
  }
  if (node.dark !== undefined) return node.dark
  if (node.value !== undefined && node.light !== undefined) return node.value
  return undefined
}

function createLeafThemeNodes(
  node: ReferenceTokenLeaf,
  tokenFields: Record<string, unknown>,
): Partial<ThemeTokenTree> {
  const themeNodes: Partial<ThemeTokenTree> = {}
  const lightValue = getLeafThemeValue(node, 'light')
  const darkValue = getLeafThemeValue(node, 'dark')

  if (lightValue !== undefined) {
    themeNodes.light = createThemeLeaf(tokenFields, lightValue)
  }
  if (darkValue !== undefined) {
    themeNodes.dark = createThemeLeaf(tokenFields, darkValue)
  }

  return themeNodes
}

function normalizeLeafTokenNode(node: ReferenceTokenLeaf): NormalizedTokenParts {
  const tokenFields = stripModeOverrides(node)
  const baseValue = getBaseLeafValue(node)
  const baseNode = baseValue !== undefined
    ? { ...tokenFields, value: baseValue }
    : {}
  const themeNodes = createLeafThemeNodes(node, tokenFields)

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
