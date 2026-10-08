// global.ts — global styles fragment for the NEO-RESP-07 world. Takes the
// neo fragment collector and emits the body ink baseline. It deliberately
// carries no container root, so the rootless subtree has no ancestor root.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
  },
})
