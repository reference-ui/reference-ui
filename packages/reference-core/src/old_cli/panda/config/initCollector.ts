import { COLLECTOR_KEY } from './extendPandaConfig'

/**
 * Initializes the config collector on globalThis so that when bundled config
 * modules run and call extendPandaConfig/tokens(), their fragments are pushed
 * here. The generated entry must import this first, then merge the collector
 * into the final config.
 */
;(globalThis as Record<string, unknown>)[COLLECTOR_KEY] = []
