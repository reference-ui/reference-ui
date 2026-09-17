// Entry for the PRIM-04 world. It takes the generated Div primitive and emits
// array-p probes inside sized container wrappers: a two-step probe in narrow,
// wide, and live containers, plus a holed probe in sm-range and md-range
// containers. Wrappers are plain host divs, so only the probes extract.
import { Div, createRoot } from '@reference-ui/react'

function Wrap({ id, width, children }: { id: string; width: string; children: unknown }) {
  return (
    <div id={id} style={{ containerType: 'inline-size', width }}>
      {children as never}
    </div>
  )
}

export function Prim() {
  return (
    <>
      <Wrap id="narrow" width="400px">
        <Div id="narrow-probe" p={['1r', '2r']}>
          narrow
        </Div>
      </Wrap>
      <Wrap id="wide" width="800px">
        <Div id="wide-probe" p={['1r', '2r']}>
          wide
        </Div>
      </Wrap>
      <Wrap id="live" width="400px">
        <Div id="live-probe" p={['1r', '2r']}>
          live
        </Div>
      </Wrap>
      <Wrap id="hole-sm" width="700px">
        <Div id="hole-sm-probe" p={['1r', null, '4r']}>
          hole sm
        </Div>
      </Wrap>
      <Wrap id="hole-md" width="800px">
        <Div id="hole-md-probe" p={['1r', null, '4r']}>
          hole md
        </Div>
      </Wrap>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
