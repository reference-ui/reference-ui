// Ambient declaration for the CORE-LAYERS-19 prebuilt package. The browser resolves `@fixture/layers19` through
// the world importmap to `prebuilt/acme.mjs`; TypeScript has no module graph for a prebuilt dist, so this
// declares the shape the app consumes. It carries no runtime and stays out of the world build.
declare module '@fixture/layers19' {
  import type { ReactElement, ReactNode } from 'react'

  interface AcmeProps {
    id?: string
    bg?: string
    children?: ReactNode
  }

  export function Badge(props: AcmeProps): ReactElement
  export function Plain(props: AcmeProps): ReactElement
}
