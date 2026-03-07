import type { Config } from '@pandacss/dev'
import { createFragmentFunction } from '../../lib/fragments/collector'

/** Global key for panda config collector. Must match reference-core's COLLECTOR_KEY for alignment. */
export const COLLECTOR_KEY = '__refPandaConfigCollector'

const { fn, collector } = createFragmentFunction<Partial<Config>, Partial<Config>>({
  name: 'panda-config',
  targetFunction: 'tokens',
  globalKey: COLLECTOR_KEY,
})

/** Extend the Panda config with a partial. When called during fragment bundle execution, the partial is collected and later merged into the base config. */
export const extendPandaConfig = fn

/** Return the panda config collector for runConfig, createPandaConfig, etc. */
export function createPandaConfigCollector() {
  return collector
}
