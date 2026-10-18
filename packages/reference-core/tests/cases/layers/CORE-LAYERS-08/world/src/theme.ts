// Consumer fragment for the CORE-LAYERS-08 world. It takes one own globalCss rule on the
// same selector the layer styles, so the own rule can be proven to win on that selector.
// It is a fragment file: the page never imports it, so no script runs in the browser.

import { globalCss } from '@reference-ui/core'

globalCss({
  '.up-probe': {
    color: '#15803d',
  },
})
