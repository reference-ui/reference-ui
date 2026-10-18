// Global base for the NEO-NAMER-02 world. It takes no inputs and emits the
// body ink the corpus rests on, so inherited paint reads as a deliberate
// resting color rather than a browser default. It carries no container
// root, so the md: conditions rest on their base lists at every width.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
  },
})
