// Ambient declaration for the CORE-LAYERS-04 upstream package. The spec links `core-layers4-up` into
// world/node_modules only while it runs, so the typecheck before it cannot resolve the package; this declares
// the one export the probe source uses. It carries no runtime and stays out of the world build.
declare module 'core-layers4-up' {
  import type { ReactElement } from 'react'

  export function Span(props: { color?: string }): ReactElement
}
