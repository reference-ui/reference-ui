// Ambient declaration for the CORE-CHAIN-16 installed package. `@fixture/chain16` stands for a package built on Reference
// UI that the app never scans and never composes; TypeScript has no module graph for it, so this declares the shape the
// app consumes. It carries no runtime and is excluded from the world build (the .d.ts filter in shared/build.ts).
declare module '@fixture/chain16' {
  import type { ReactElement, ReactNode } from 'react'

  interface PackageProps {
    children?: ReactNode
    color?: string
    css?: Record<string, string>
  }

  export function Button(props: PackageProps): ReactElement
  export function Tile(props: PackageProps): ReactElement
}
