// Root fragment for the CORE-LAYERS-04 upstream. It takes the author globalCss
// call and emits a :root container type, the verdict the container-root check
// reads from every layered or extended upstream's published global CSS.
import { globalCss } from '@reference-ui/core'

globalCss({
  ':root': { containerType: 'inline-size' },
})
