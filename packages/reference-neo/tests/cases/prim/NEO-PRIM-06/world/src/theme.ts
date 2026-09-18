// Global fragment for the PRIM-06 world. It takes the neo fragment collector
// and emits one tag recipe: the ref-div marker scoped to the accent variant.
// This mirrors the lib grammar, where variants live on [data-variant].
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-div[data-variant="accent"]': {
    color: '{colors.brand}',
  },
})
