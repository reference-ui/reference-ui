// global.ts — global styles fragment for the CORE-RESP-01 world. Takes the
// core fragment collector and emits the body ink baseline. It carries no
// container root, so container queries resolve against the probe wrappers.
import { globalCss } from '@reference-ui/core'

globalCss({
  body: {
    color: '#111111',
  },
})
