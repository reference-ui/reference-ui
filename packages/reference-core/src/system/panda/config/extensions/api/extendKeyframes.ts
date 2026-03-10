import type { Config } from '@pandacss/dev'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

type KeyframesFragment = Record<string, unknown>

export function extendKeyframes(keyframesFragments: KeyframesFragment[]): Partial<Config> {
  if (keyframesFragments.length === 0) {
    return getPandaConfig()
  }

  const pandaConfig = getPandaConfig() as RuntimeStore
  const mergedKeyframes = deepMerge({}, ...keyframesFragments)

  pandaConfig.theme = deepMerge({}, toRecord(pandaConfig.theme), {
    extend: {
      keyframes: mergedKeyframes,
    },
  })

  return pandaConfig as Partial<Config>
}
