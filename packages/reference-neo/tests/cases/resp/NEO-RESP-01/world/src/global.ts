// global.ts — global styles fragment for the NEO-RESP-01 world. Takes the
// neo fragment collector and emits the body ink baseline. It carries no
// container root, so container queries resolve against the probe wrappers.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
  },
})
