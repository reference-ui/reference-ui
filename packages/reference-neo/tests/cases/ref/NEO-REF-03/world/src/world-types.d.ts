// World types seam: it types the bare @world/types specifier the world entry imports for Reference.
// The importmap maps that specifier to the generated bundle at serve time, so these declarations only steer
// the pre-sync typecheck and never reach the browser. They name the shipped props exactly, nothing more.
declare module '@world/types' {
  import type { ComponentType } from 'react'

  export const Reference: ComponentType<{ name: string }>
}
