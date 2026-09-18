// Entry for the PRIM-02 world. It takes the generated Div primitive and emits
// two probes: one pairing sibling StyleProps with a css prop, one pitting the
// css color against the sibling color. Extraction source and browser entry
// stay one file, so the compiler and the page can never drift apart.
import { Div, createRoot } from '@reference-ui/react'

export function Prim() {
  return (
    <>
      <Div id="both" color="ink" p="sm" css={{ backgroundColor: 'brand' }}>
        both sources
      </Div>
      <Div id="conflict" color="ink" css={{ color: 'brand' }}>
        css wins
      </Div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
