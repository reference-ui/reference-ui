// Foreign probe source for the CORE-LAYERS-04 world. It takes the upstream package's own `Span` and emits it with
// a literal colour: a tag imported from an installed package renders through that package's runtime, so the
// engine keeps the style prop as an external want and backs it in the consumer's foreign group for the upstream.
// The spec links the package into world/node_modules; the page carries the class in index.html and never renders this.
import { Span } from 'core-layers4-up'

export function Foreign() {
  return <Span color="#15803d" />
}
