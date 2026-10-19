// Minimal app for the CORE-DIAG-54 world. It takes no props and renders an
// empty span. The warning comes from the spec's unresolvable
// `@fixtures/missing-ui` analyzer include, so analyzing the world must
// surface ATL-W-UNRESOLVED-INCLUDE-PACKAGE as a warning with a non-blank
// message.
import * as React from 'react'

export function Ok(): React.ReactElement {
  return <span />
}
