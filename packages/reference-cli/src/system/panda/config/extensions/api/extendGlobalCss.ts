import type { Config } from '@pandacss/dev'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

type GlobalCssConfig = NonNullable<Config['globalCss']>

export function extendGlobalCss(css: GlobalCssConfig): Partial<Config> {
  const pandaConfig = getPandaConfig() as RuntimeStore

  pandaConfig.globalCss = deepMerge({}, toRecord(pandaConfig.globalCss), css)

  return pandaConfig as Partial<Config>
}
