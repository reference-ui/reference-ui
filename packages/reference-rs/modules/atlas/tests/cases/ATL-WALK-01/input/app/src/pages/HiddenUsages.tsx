import { Component, type ReactNode } from 'react'
import { Button } from '@reference-ui/react'
import { Fallback } from '../components/Fallback'
import { Notice } from '../components/Notice'
import { Banner } from '../components/Banner'
import { Badge } from '../components/Badge'
import { Label } from '../components/Label'

declare function renderToString(node: ReactNode): string

// Class body: render() lives in a class, not a function or arrow.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  render() {
    if (this.state.failed) {
      return (
        <Fallback tone="danger">
          <Button tone="class">Retry</Button>
        </Fallback>
      )
    }
    return this.props.children
  }
}

// Optional-chain call: the argument of `render?.(...)`.
export function Slot({ render }: { render?: (node: ReactNode) => ReactNode }) {
  return render?.(
    <Notice tone="info">
      <Button tone="optional">Dismiss</Button>
    </Notice>
  )
}

// `throw`: the thrown expression.
export function fail(): never {
  throw renderToString(
    <Banner tone="error">
      <Button tone="throw">Report</Button>
    </Banner>
  )
}

// Template literal: an expression inside `${...}`.
export const badgeHtml = `<div>${renderToString(
  <Badge tone="new">
    <Button tone="template">Open</Button>
  </Badge>
)}</div>`

// `new` arguments: JSX passed to a constructor.
export const labels = new Map([
  [
    'primary',
    <Label tone="primary">
      <Button tone="new">Pick</Button>
    </Label>,
  ],
])
