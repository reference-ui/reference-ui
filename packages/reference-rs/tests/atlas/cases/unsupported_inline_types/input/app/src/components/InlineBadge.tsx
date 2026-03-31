import * as React from 'react'

export function InlineBadge(props: {
  label: string
  tone?: 'info' | 'warn'
}): React.ReactElement {
  return <span data-tone={props.tone}>{props.label}</span>
}
