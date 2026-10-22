// Theme fragment for the SYNC-19 world: it sets --gap from getRhythm(2).
// The import comes from @reference-ui/system, the way a theme file reaches it. It takes nothing and emits the :root
// rule the spec asserts in the generated sheet.
import { getRhythm, globalCss } from '@reference-ui/system'

globalCss({
  ':root': {
    '--gap': getRhythm(2),
  },
})
