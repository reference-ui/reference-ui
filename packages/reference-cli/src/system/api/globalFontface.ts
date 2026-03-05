import { createFragmentCollector } from '../../lib/fragments/collector'
import type { Config } from '@pandacss/dev'

type GlobalFontfaceConfig = NonNullable<Config['globalFontface']>
type PandaConfig = Partial<Config>

/**
 * Fragment collector for global @font-face rules.
 * Transforms font-face definitions into Panda config shape: { globalFontface }
 */
export const globalFontfaceCollector = createFragmentCollector<
  GlobalFontfaceConfig,
  PandaConfig
>({
  name: 'globalFontface',
  targetFunction: 'globalFontface',
  transform: config => ({
    globalFontface: config,
  }),
})

/**
 * Register global @font-face rules with Panda CSS.
 *
 * @example
 * ```ts
 * globalFontface({
 *   Inter: {
 *     src: 'url(...) format("woff2")',
 *     fontWeight: '100 900',
 *     fontDisplay: 'swap',
 *   },
 * })
 * ```
 */
export const globalFontface = globalFontfaceCollector.collect
