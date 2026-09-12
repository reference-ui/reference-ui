import * as React from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'

export type Host = {
  render: (node: React.ReactNode) => void
  unmount: () => void
}

export function createHost(el: HTMLElement): Host {
  let root: Root | null = null
  return {
    render(node) {
      root ??= createRoot(el)
      flushSync(() => {
        root!.render(node)
      })
    },
    unmount() {
      root?.unmount()
      root = null
    },
  }
}
