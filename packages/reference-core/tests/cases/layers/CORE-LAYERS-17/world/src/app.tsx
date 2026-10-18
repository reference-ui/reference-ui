// app.tsx — the entry for the CORE-LAYERS-17 world. It takes the colour mode from the query string, stamps html
// data-color-mode before the first render, and renders a consumer Div that holds two probes from the layered
// upstream's published Div: one paints upInk and one paints upSoft. The upstream bundle arrives through the
// importmap name the page declares, so each probe paints through the upstream's own css() and layer.
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
const UPSTREAM_SPECIFIER: string = 'core-layers17-up'

function stampHtmlMode(): void {
  const mode = new URLSearchParams(window.location.search).get('mode')
  if (mode) document.documentElement.setAttribute('data-color-mode', mode)
}

function Probes({ upstream }: { upstream: UpstreamReact }) {
  const UpDiv = upstream.Div
  return (
    <Div id="consumer-root">
      <UpDiv id="up-ink" color="upInk">
        upstream ink
      </UpDiv>
      <UpDiv id="up-soft" color="upSoft">
        upstream soft
      </UpDiv>
    </Div>
  )
}

async function main(): Promise<void> {
  stampHtmlMode()
  const upstream = (await import(UPSTREAM_SPECIFIER)) as UpstreamReact
  const root = document.getElementById('root')
  if (!root) throw new Error('missing #root')
  createRoot(root).render(<Probes upstream={upstream} />)
}

void main()
