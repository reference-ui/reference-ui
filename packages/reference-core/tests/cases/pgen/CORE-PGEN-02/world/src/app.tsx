// Entry for the PGEN-02 world. It takes the bound text primitives and emits
// one probe per html-text family member plus the seven single-letter
// specials inside a plain census root, then two holed array probes inside
// sized container wrappers. Wrappers are plain host divs, so only the
// probes extract.
import { createRoot } from 'react-dom/client'
import { A, Abbr, B, Bdi, Bdo, Cite, Code, Data, Del, Dfn, Em, I, Ins, Kbd, Mark, P, Q, Rp, Rt, Ruby, S, Samp, Small, Span, Strong, Sub, Sup, Time, U } from '@reference-ui/react'

function Wrap({ id, width, children }: { id: string; width: string; children: unknown }) {
  return (
    <div id={id} style={{ containerType: 'inline-size', width }}>
      {children as never}
    </div>
  )
}

export function PgenText() {
  return (
    <>
      <div id="text-root">
        <Abbr id="text-abbr" color="brand">abbr</Abbr>
        <Bdi id="text-bdi" color="brand">bdi</Bdi>
        <Bdo id="text-bdo" color="brand">bdo</Bdo>
        <Cite id="text-cite" color="brand">cite</Cite>
        <Code id="text-code" color="brand">code</Code>
        <Data id="text-data" color="brand">data</Data>
        <Del id="text-del" color="brand">del</Del>
        <Dfn id="text-dfn" color="brand">dfn</Dfn>
        <Em id="text-em" color="brand">em</Em>
        <Ins id="text-ins" color="brand">ins</Ins>
        <Kbd id="text-kbd" color="brand">kbd</Kbd>
        <Mark id="text-mark" color="brand">mark</Mark>
        <Rp id="text-rp" color="brand">rp</Rp>
        <Rt id="text-rt" color="brand">rt</Rt>
        <Ruby id="text-ruby" color="brand">ruby</Ruby>
        <Samp id="text-samp" color="brand">samp</Samp>
        <Small id="text-small" color="brand">small</Small>
        <Span id="text-span" color="brand">span</Span>
        <Strong id="text-strong" color="brand">strong</Strong>
        <Sub id="text-sub" color="brand">sub</Sub>
        <Sup id="text-sup" color="brand">sup</Sup>
        <Time id="text-time" color="brand">time</Time>
        <A id="text-a" color="brand">a</A>
        <B id="text-b" color="brand">b</B>
        <I id="text-i" color="brand">i</I>
        <P id="text-p" color="brand">p</P>
        <Q id="text-q" color="brand">q</Q>
        <S id="text-s" color="brand">s</S>
        <U id="text-u" color="brand">u</U>
      </div>
      <Wrap id="hole-sm" width="700px">
        <Span id="hole-sm-probe" p={['1r', null, '4r']}>
          hole sm
        </Span>
      </Wrap>
      <Wrap id="hole-md" width="800px">
        <Span id="hole-md-probe" p={['1r', null, '4r']}>
          hole md
        </Span>
      </Wrap>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PgenText />)
