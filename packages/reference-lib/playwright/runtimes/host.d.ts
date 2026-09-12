declare module 'ct-host' {
  import type { ReactNode } from 'react'

  export type Host = {
    render: (node: ReactNode) => void
    unmount: () => void
  }

  export function createHost(el: HTMLElement): Host
}
