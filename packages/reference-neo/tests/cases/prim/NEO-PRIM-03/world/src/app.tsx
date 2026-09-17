// Entry for the PRIM-03 world. It takes the generated Div primitive and emits
// a live hover probe plus its data-hover twin, both through the _hover style
// prop. Extraction source and browser entry stay one file, so the compiler
// and the page can never drift apart.
import { Div, createRoot } from '@reference-ui/react'

export function Prim() {
  return (
    <>
      <Div id="live" color="ink" _hover={{ color: 'brand' }}>
        hover live
      </Div>
      <Div id="twin" data-hover _hover={{ color: 'brand' }}>
        hover twin
      </Div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
