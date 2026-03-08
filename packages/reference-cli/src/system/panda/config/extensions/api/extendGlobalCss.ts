import type { Config } from '@pandacss/dev'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

type GlobalCssConfig = NonNullable<Config['globalCss']>

export function extendGlobalCss(cssFragments: GlobalCssConfig[]): Partial<Config>
export function extendGlobalCss(...cssFragments: GlobalCssConfig[]): Partial<Config>
export function extendGlobalCss(
  first: GlobalCssConfig | GlobalCssConfig[],
  ...rest: GlobalCssConfig[]
): Partial<Config> {
  const cssFragments = Array.isArray(first) && rest.length === 0
    ? first
    : ([first, ...rest] as GlobalCssConfig[])

  if (cssFragments.length === 0) {
    return getPandaConfig()
  }

  const pandaConfig = getPandaConfig() as RuntimeStore

  pandaConfig.globalCss = deepMerge({}, toRecord(pandaConfig.globalCss), ...cssFragments)

  return pandaConfig as Partial<Config>
}
