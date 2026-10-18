// app.tsx — browser entry for the NEO-PRIM-15 world. Takes the page root
// and emits six probes, one per corner-pair shorthand at 2r. The compiler
// extracts every primitive prop literally, so each pair expands to its two
// corner longhands at build time.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

export function Prim() {
  return (
    <>
      <Div id="radius-top-pair" borderTopRadius="2r" borderWidth="1px" borderStyle="solid">
        Top pair
      </Div>
      <Div id="radius-bottom-pair" borderBottomRadius="2r" borderWidth="1px" borderStyle="solid">
        Bottom pair
      </Div>
      <Div id="radius-left-pair" borderLeftRadius="2r" borderWidth="1px" borderStyle="solid">
        Left pair
      </Div>
      <Div id="radius-right-pair" borderRightRadius="2r" borderWidth="1px" borderStyle="solid">
        Right pair
      </Div>
      <Div id="radius-start-pair" borderStartRadius="2r" borderWidth="1px" borderStyle="solid">
        Start pair
      </Div>
      <Div id="radius-end-pair" borderEndRadius="2r" borderWidth="1px" borderStyle="solid">
        End pair
      </Div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
