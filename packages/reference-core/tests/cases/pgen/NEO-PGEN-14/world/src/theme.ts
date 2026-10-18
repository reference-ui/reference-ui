// Global fragment for the PGEN-14 world. It takes the neo fragment collector
// and emits one tag recipe: the ref-div marker scoped to the accent
// variant, mirroring the PRIM-06 precedent the variant twin paints from.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-div[data-variant="accent"]': {
    color: '{colors.brand}',
  },
})
