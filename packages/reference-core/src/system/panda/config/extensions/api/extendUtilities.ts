import type { Config } from '@pandacss/dev'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

type UtilityExtend = NonNullable<NonNullable<Config['utilities']>['extend']>

export function extendUtilities(utilitiesExtend: UtilityExtend): Partial<Config> {
  const pandaConfig = getPandaConfig() as RuntimeStore

  pandaConfig.utilities = deepMerge({}, toRecord(pandaConfig.utilities), {
    extend: utilitiesExtend,
  })

  return pandaConfig as Partial<Config>
}
