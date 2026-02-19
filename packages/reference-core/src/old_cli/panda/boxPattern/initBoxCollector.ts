import { BOX_PATTERN_COLLECTOR_KEY } from './extendBoxPattern'

/**
 * Initialize the box pattern collector before extension modules run.
 * The collect script imports this first, then extension files.
 */
;(globalThis as Record<string, unknown>)[BOX_PATTERN_COLLECTOR_KEY] = []
