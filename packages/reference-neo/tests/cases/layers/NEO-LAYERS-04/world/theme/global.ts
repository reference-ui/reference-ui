// Global fragment for the NEO-LAYERS-04 world. It takes the neo globalCss
// collector and emits the body ink only, with no container root of its own.
// That leaves the container query unrooted until an upstream roots it.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: { color: '#111111' },
})
