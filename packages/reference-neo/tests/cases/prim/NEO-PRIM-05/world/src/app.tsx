// Entry for the PRIM-05 world. It takes the generated Div primitive and emits
// a settled outer tree plus a second tree mounted on a nested host: separate
// React trees share no scope context, so the inner tree stamps the layer
// again the way a nested second system would across its own boundary.
import { Div, createRoot } from '@reference-ui/react'

export function Prim() {
  return (
    <Div id="outer" colorMode="light">
      <Div id="middle">
        <div id="inner-host"></div>
      </Div>
    </Div>
  )
}

export function Inner() {
  return (
    <Div id="inner" color="brand">
      inner tree
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)

// The outer tree commits asynchronously; mount the inner tree once its host
// lands in the DOM.
function mountInner(): void {
  const host = document.getElementById('inner-host')
  if (!host) {
    requestAnimationFrame(mountInner)
    return
  }
  createRoot(host).render(<Inner />)
}
requestAnimationFrame(mountInner)
