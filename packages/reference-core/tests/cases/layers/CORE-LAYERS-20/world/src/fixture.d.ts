// Ambient declaration for the CORE-LAYERS-20 prebuilt packages. The browser resolves `@fixture/layers20` through the
// world importmap to `prebuilt/nested.mjs`; TypeScript has no module graph for a prebuilt dist, so this declares the
// shape the app consumes. It carries no runtime and stays out of the world build.
declare module '@fixture/layers20' {
  import type { ReactElement, ReactNode } from 'react'

  interface PackageProps {
    id?: string
    children?: ReactNode
  }

  export function ABadge(props: PackageProps): ReactElement
  export function BCard(props: PackageProps): ReactElement
}
