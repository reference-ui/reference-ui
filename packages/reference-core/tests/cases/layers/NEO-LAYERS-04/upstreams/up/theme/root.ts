// Root fragment for the NEO-LAYERS-04 upstream. It takes the author globalCss
// call and emits a :root container type, the verdict the container-root check
// reads from every layered or extended upstream's published global CSS.
import { globalCss } from '@reference-ui/neo'

globalCss({
  ':root': { containerType: 'inline-size' },
})
