// The style source for the NEO-WATCH-16 world. It takes the brand token and emits one css() class, cls, that the probe
// page can use. The types build scans it together with the other theme sources under include.
import { css } from '@reference-ui/react'

export const cls = css({ color: 'brand' })
