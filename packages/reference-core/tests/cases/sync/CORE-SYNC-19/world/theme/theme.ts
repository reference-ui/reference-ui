// Theme fragment for the SYNC-18 world: sets --gap from getRhythm(2), imported from @reference-ui/system the way a
// theme file reaches it. Takes nothing and emits the :root rule the spec asserts in the generated sheet.
import { getRhythm, globalCss } from '@reference-ui/system'

globalCss({
  ':root': {
    '--gap': getRhythm(2),
  },
})
