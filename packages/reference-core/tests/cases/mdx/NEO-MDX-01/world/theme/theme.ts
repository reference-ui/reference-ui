// Global rules for the NEO-MDX-01 world. They take no input and emit the
// `.ref-display` tag recipe as a brace ref to the MDX-registered face, so the
// probe paints the family even though the font binary never loads. The
// `{fonts.display}` brace form resolves to the token var; a bare alias would
// pass through literally.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-display': {
    fontFamily: '{fonts.display}',
  },
})
