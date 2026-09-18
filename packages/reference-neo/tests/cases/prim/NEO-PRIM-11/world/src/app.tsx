// Entry for the PRIM-11 world. It takes the generated Div primitive and emits
// one probe in the exact Panda array form: two style objects in the css slot.
// Extraction source and browser entry stay one file, so the compiler and the
// page can never drift apart.
import { Div, createRoot } from '@reference-ui/react'

export function Prim() {
  return (
    <Div id="array" css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]}>
      array css
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
