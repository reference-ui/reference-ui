// Global rules for the GLOBAL-07 world. They take no input and emit three
// at-rule nests in the panda nested-at-rule shape: a matching viewport media
// query, a never-matching one, and a container width gate. Token refs ride
// inside the nested declarations the way lib hover rules carry them.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-note': {
    color: '#111111',
    '@media (min-width: 100px)': {
      color: '{colors.ui.note.match}',
    },
  },
  '.ref-far': {
    color: '#111111',
    '@media (min-width: 5000px)': {
      color: '{colors.ui.note.far}',
    },
  },
  '.ref-chip': {
    color: '#111111',
    '@container (min-width: 400px)': {
      color: '{colors.ui.note.wide}',
    },
  },
})
