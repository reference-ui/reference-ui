// app.tsx — browser entry and extraction source for the NEO-LAYERS-10 world. It takes the color
// mode from the query string and stamps html data-color-mode before the first render, then renders
// the layered upstream's published Div with one consumer Div as its child. The upstream bundle
// arrives through the importmap name the page declares, so the consumer child sits inside a
// layered component the way consumer content does in a real app.
import type { FC, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

interface UpstreamProps {
  id: string
  color: string
  children?: ReactNode
}

interface UpstreamReact {
  Div: FC<UpstreamProps>
}

// Typed as string so the import stays a runtime lookup, not a module the typecheck resolves.
const UPSTREAM_SPECIFIER: string = 'neo-layers10-up'

function stampHtmlMode(): void {
  const mode = new URLSearchParams(window.location.search).get('mode')
  if (mode) document.documentElement.setAttribute('data-color-mode', mode)
}

function Probe({ upstream }: { upstream: UpstreamReact }) {
  const UpDiv = upstream.Div
  return (
    <UpDiv id="up-layered" color="probeInk">
      <Div id="consumer-child" color="probeInk">
        consumer child
      </Div>
    </UpDiv>
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
