import * as React from 'react'

export function InlineBadge(props: {
  label: string
}): React.ReactElement {
  return <span>{props.label}</span>
}
