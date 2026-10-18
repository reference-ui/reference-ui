// Ambient declaration for the CORE-CHAIN-15 prebuilt package. The browser resolves `@fixture/chain15` through the world
// importmap to `prebuilt/chain15.mjs`; TypeScript has no module graph for a prebuilt dist, so this declares the shape the
// app consumes. It carries no runtime and is excluded from the world build (the .d.ts filter in shared/build.ts).
declare module '@fixture/chain15' {
  import type { ReactElement, ReactNode } from 'react'

  interface PackageProps {
    children?: ReactNode
    color?: string
    css?: Record<string, string>
    'data-testid'?: string
  }

  export function Button(props: PackageProps): ReactElement
  export function Tile(props: PackageProps): ReactElement
}
