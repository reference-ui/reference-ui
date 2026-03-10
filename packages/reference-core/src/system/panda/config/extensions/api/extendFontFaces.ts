import type { Config } from '@pandacss/dev'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

type GlobalFontfaceConfig = NonNullable<Config['globalFontface']>

export function extendFontFaces(fontface: GlobalFontfaceConfig): Partial<Config> {
  if (Object.keys(fontface).length === 0) {
    return getPandaConfig()
  }

  const pandaConfig = getPandaConfig() as RuntimeStore

  pandaConfig.globalFontface = deepMerge({}, toRecord(pandaConfig.globalFontface), fontface)

  return pandaConfig as Partial<Config>
}
