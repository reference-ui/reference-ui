import { createFragmentCollector } from '../../lib/fragments/collector'
import type { FragmentCollector } from '../../lib/fragments'
import type { Config } from '@pandacss/dev'

type StaticCssConfig = NonNullable<Config['staticCss']>
type PandaConfig = Partial<Config>

const collector = createFragmentCollector<StaticCssConfig, PandaConfig>({
  name: 'staticCss',
  targetFunction: 'staticCss',
  transform: config => ({
    staticCss: config,
  }),
})

/** Cast for declaration emit — tsup/tsdown cannot inline ExtendableStaticCssOptions (TS4023). */
export const staticCssCollector = collector as FragmentCollector<
  Record<string, unknown>,
  Record<string, unknown>
>

/**
 * Register static CSS with your design system.
 * Use to force certain utilities/recipes to be generated at build time.
 *
 * @example
 * ```ts
 * staticCss({
 *   css: [{ properties: { color: ['*'] } }],
 *   recipes: { button: ['*'] },
 * })
 * ```
 */
export const staticCss = collector.collect as (config: Record<string, unknown>) => void
