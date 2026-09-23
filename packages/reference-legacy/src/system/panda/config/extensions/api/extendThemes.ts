import type { Config } from '@pandacss/dev'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

type ThemeConfig = Record<string, unknown>

function getStaticThemeNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string')
}

export function extendThemes(fragments: ThemeConfig[]): Partial<Config>
export function extendThemes(...fragments: ThemeConfig[]): Partial<Config>
export function extendThemes(
  first: ThemeConfig | ThemeConfig[],
  ...rest: ThemeConfig[]
): Partial<Config> {
  const themeFragments = Array.isArray(first) && rest.length === 0
    ? first
    : ([first, ...rest] as ThemeConfig[])

  if (themeFragments.length === 0) {
    return getPandaConfig()
  }

  const pandaConfig = getPandaConfig() as RuntimeStore
  const mergedThemes = deepMerge({}, ...themeFragments)
  const themeNames = Object.keys(mergedThemes)

  if (themeNames.length === 0) {
    return pandaConfig as Partial<Config>
  }

  pandaConfig.themes = deepMerge({}, toRecord(pandaConfig.themes), mergedThemes)

  const staticCss = toRecord(pandaConfig.staticCss)
  const existingThemes = getStaticThemeNames(staticCss.themes)

  pandaConfig.staticCss = {
    ...staticCss,
    themes: Array.from(new Set([...existingThemes, ...themeNames])),
  }

  return pandaConfig as Partial<Config>
}
