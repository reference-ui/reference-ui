// Minimal app for the CORE-DIAG-55 world. It takes no props and renders an
// empty span. The failure comes from the spec's invalid `[` analyzer
// exclude, so analyzing the world must refuse with ATL-E-SCAN-FAILED as an
// error with a non-blank message.
import * as React from 'react'

export function Ok(): React.ReactElement {
  return <span />
}
