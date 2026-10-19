// Ambient `ct-host` module: the per-major render host contract.
// It takes nothing and emits the Host render/unmount typings each runtime's host
// implements and the gallery entry consumes.
declare module 'ct-host' {
  import type { ReactNode } from 'react'

  export type Host = {
    render: (node: ReactNode) => void
    unmount: () => void
  }

  export function createHost(el: HTMLElement): Host
}
