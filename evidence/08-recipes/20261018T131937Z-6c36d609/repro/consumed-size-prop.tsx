import { Button } from '@reference-ui/react'

// docs/primitives.mdx: a size consumed as data-size stays the component's prop.
function LocalButton({ size }: { size: 'sm' | 'lg' }) {
  return <Button data-size={size}>Consumer-owned size</Button>
}

export const example = <LocalButton size="lg" />

// Passing control: same semantics under a different consumer prop name.
function LocalNamedButton({ buttonSize }: { buttonSize: 'sm' | 'lg' }) {
  return <Button data-size={buttonSize}>Consumer-owned size control</Button>
}

export const control = <LocalNamedButton buttonSize="lg" />
