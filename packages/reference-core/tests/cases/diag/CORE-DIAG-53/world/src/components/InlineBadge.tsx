// Minimal app for ATL-W-UNSUPPORTED-PROPS-ANNOTATION in the CORE-DIAG-53
// world. It takes an inline props object annotation and renders the label in
// a span. The inline annotation is unsupported, so analyzing the world must
// surface the code as a warning with a non-blank message.
import * as React from 'react'

export function InlineBadge(props: {
  label: string
}): React.ReactElement {
  return <span>{props.label}</span>
}
