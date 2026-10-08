import { css } from '@reference-ui/react'

// Doom-4 T2: exact shortest-ties through the numeric funnel. Each spelling
// parses to an f64 its two adjacent shortest neighbors both round-trip,
// so V8 breaks even and the oracle breaks away — the class carries the
// larger magnitude. Witness, both signs, the low-edge tie, and a `{7,8}`
// agreement control (both sides pick 8).
export const witness = css({ width: '752396555469991.2' })
export const negative = css({ top: '-1773218474086427.2' })
export const lowEdge = css({ top: '-595433053192.7812' })
export const agree78 = css({ width: '1674911018215997.8' })
