// Ambient declaration for the CORE-CHAIN-15 upstream package, `@fixture/chain15`. The spec installs the package in
// world/node_modules only while it runs, so the typecheck before it cannot resolve the import; this declares the shape
// the app consumes. It carries no runtime and is excluded from the world build (the .d.ts filter in shared/build.ts).
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
