import { createFragmentCollector } from '../../lib/fragments/collector'
import type { Config } from '@pandacss/dev'

type GlobalCssConfig = NonNullable<Config['globalCss']>
type PandaConfig = Partial<Config>

/**
 * Fragment collector for global CSS.
 * Transforms global CSS definitions into Panda config shape: { globalCss }
 */
export const globalCssCollector = createFragmentCollector<GlobalCssConfig, PandaConfig>({
  name: 'globalCss',
  targetFunction: 'globalCss',
  transform: config => ({
    globalCss: config,
  }),
})

/**
 * Register global CSS with your design system.
 *
 * Define styles that apply globally across your application.
 * Supports CSS selectors, pseudo-classes, media queries, and CSS custom properties.
 *
 * @param config - Global CSS configuration with selectors as keys and style objects as values
 *
 * @example Basic usage
 * ```ts
 * import { globalCss } from '@reference-ui/system'
 *
 * globalCss({
 *   ':root': {
 *     '--r-base': '16px',
 *     '--r-color-primary': '#0066cc',
 *   },
 *   'html, body': {
 *     margin: '0',
 *     padding: '0',
 *   },
 *   body: {
 *     fontFamily: 'system-ui, sans-serif',
 *     fontSize: '16px',
 *     lineHeight: '1.5',
 *   },
 * })
 * ```
 *
 * @example With nested selectors and media queries
 * ```ts
 * globalCss({
 *   'a': {
 *     color: 'blue.500',
 *     textDecoration: 'none',
 *     _hover: {
 *       textDecoration: 'underline',
 *     },
 *   },
 *   '@media (prefers-reduced-motion)': {
 *     '*': {
 *       animation: 'none !important',
 *       transition: 'none !important',
 *     },
 *   },
 * })
 * ```
 */
export const globalCss = globalCssCollector.collect
