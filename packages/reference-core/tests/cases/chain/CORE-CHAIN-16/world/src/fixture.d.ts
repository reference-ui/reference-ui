// Ambient declarations for the CORE-CHAIN-16 installed packages. The spec installs `@fixture/chain16` (built on
// Reference UI) and `plain-glyphs` (not) in world/node_modules only while it runs, so the typecheck before it cannot
// resolve them; this declares the shapes the app consumes. It carries no runtime and is excluded from the world build
// (the .d.ts filter in shared/build.ts).
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

declare module 'plain-glyphs' {
  import type { ReactElement } from 'react'

  export function Glyph(props: { color?: string }): ReactElement
}
