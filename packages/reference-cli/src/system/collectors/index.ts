/**
 * Fragment collectors — the layer that extends Panda config.
 * extendPandaConfig is the sole collector; tokens/keyframes/etc. write to it.
 * extendPattern and extendFont were removed (see system/fragments.md).
 */

export {
  extendPandaConfig,
  createPandaConfigCollector,
  COLLECTOR_KEY,
} from './extendPandaConfig'
