/**
 * Public entrypoint of the MCP matrix fixture app. Re-exports the showcase
 * `Index` page and the demo components the MCP tools observe (`get_component`,
 * examples, props). The surface the tool suites query; not a shipped package.
 */

export { Index } from './Index'
export {
  ComponentShowcase,
  FeatureCard,
  HeroBanner,
  PrimaryAction,
  type FeatureCardProps,
  type HeroBannerProps,
  type PrimaryActionProps,
} from './components'