import type { Config } from '@pandacss/dev'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

type TokenFragment = Record<string, unknown>

export function extendTokens(tokenFragments: TokenFragment[]): Partial<Config> {
  if (tokenFragments.length === 0) {
    return getPandaConfig()
  }

  const pandaConfig = getPandaConfig() as RuntimeStore
  const mergedTokens = deepMerge({}, ...tokenFragments)

  pandaConfig.theme = deepMerge({}, toRecord(pandaConfig.theme), {
    tokens: mergedTokens,
  })

  return pandaConfig as Partial<Config>
}
