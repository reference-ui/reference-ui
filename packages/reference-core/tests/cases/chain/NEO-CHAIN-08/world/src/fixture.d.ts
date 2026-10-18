// Ambient declaration for the prebuilt fixture component. The browser resolves
// `@fixture/prebuilt` through the world importmap to `prebuilt/badge.mjs`;
// TypeScript has no module graph for a prebuilt dist, so this declares the
// shape the app consumes. It carries no runtime and is excluded from the
// world build (the .d.ts filter in shared/build.ts).
declare module '@fixture/prebuilt' {
  import type { ReactElement, ReactNode } from 'react'
  export function Badge(props: {
    children?: ReactNode
    color?: string
    'data-testid'?: string
  }): ReactElement
}
