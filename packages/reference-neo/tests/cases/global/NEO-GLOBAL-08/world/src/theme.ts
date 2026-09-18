// Global rules for the GLOBAL-08 world. They take no input and emit two font
// family applications as brace refs to the registered faces: bare aliases
// pass through literally, so `{fonts.*}` is the form that resolves to the
// token var. The families paint computed even though the font binaries never
// load; loading is not this case's claim.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-serif': {
    fontFamily: '{fonts.serif}',
  },
  '.ref-mono': {
    fontFamily: '{fonts.mono}',
  },
})
