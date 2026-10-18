// Entry for the CORE-LAYERS-09 world. It takes the color mode from the query string and
// stamps html data-color-mode before the first render, then renders a consumer Div that
// holds a same-system Div and the layered upstream's published Div. The upstream bundle
// arrives through the importmap name the page declares, so its probe paints with the
// upstream's own css() and layer, the way a published component does in a consumer app.
import type { FC } from 'react'
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

interface UpstreamProbeProps {
  id: string
  color: string
  children: string
}

interface UpstreamReact {
  Div: FC<UpstreamProbeProps>
}

// Typed as string so the import stays a runtime lookup, not a module the typecheck resolves.
const UPSTREAM_SPECIFIER: string = 'core-layers9-up'

function stampHtmlMode(): void {
  const mode = new URLSearchParams(window.location.search).get('mode')
  if (mode) document.documentElement.setAttribute('data-color-mode', mode)
}

function Probe({ upstream }: { upstream: UpstreamReact }) {
  const UpDiv = upstream.Div
  return (
    <Div id="consumer-root">
      <Div id="consumer-inner">consumer inner</Div>
      <UpDiv id="up-probe" color="upInk">
        upstream probe
      </UpDiv>
    </Div>
  )
}

async function main(): Promise<void> {
  stampHtmlMode()
  const upstream = (await import(UPSTREAM_SPECIFIER)) as UpstreamReact
  const root = document.getElementById('root')
  if (!root) throw new Error('missing #root')
  createRoot(root).render(<Probe upstream={upstream} />)
}

void main()
