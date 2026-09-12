import * as React from 'react'
import * as ReactDOM from 'react-dom'

type Host = {
  render: (node: React.ReactNode) => void
  unmount: () => void
}

type React17Dom = {
  render: (node: React.ReactElement, container: Element | DocumentFragment) => void
  unmountComponentAtNode: (container: Element | DocumentFragment) => boolean
}

const dom = ReactDOM as unknown as React17Dom

export type { Host }

export function createHost(el: HTMLElement): Host {
  return {
    render(node) {
      dom.render(React.createElement(React.Fragment, null, node), el)
    },
    unmount() {
      dom.unmountComponentAtNode(el)
    },
  }
}
