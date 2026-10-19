// Ambient declaration for the CORE-CHAIN-17 workspace package, `@acme/ui`. The spec links the package into the
// root's node_modules only while it runs, so the typecheck before it cannot resolve the import; this declares the
// shape the app consumes, a Div's props. It carries no runtime and stays out of the app build.
declare module '@acme/ui' {
  import type { ReactElement } from 'react'
  import type { DivProps } from '@reference-ui/react'

  export function Card(props: DivProps): ReactElement
}
