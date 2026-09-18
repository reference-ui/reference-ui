// Entry for the NEO-LAYER-02 world. It takes the three static probes and the
// served portable base system, paints the mixed, recipe-only, and adopted
// nodes synchronously, then fetches the portable chunk, injects it into a
// blank consumer frame, and creates the two data-layer probes inside — so
// the frame's existence proves the injection it depends on already landed.
import { css, recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const card = recipe({ className: 'card', base: { color: 'brass' } })

el('mixed').className = `${card()} ${css({ color: 'ink' })}`
el('recipeonly').className = card()
el('up').className = css({ color: 'brass' })

interface PortableChunk {
  css: string
}

interface PortableSystem {
  cssChunks: PortableChunk[]
}

async function injectPortable(): Promise<void> {
  const response = await fetch('./.reference-ui/system/baseSystem.mjs')
  if (!response.ok) throw new Error(`portable fetch failed: HTTP ${response.status}`)
  const text = await response.text()
  const parsed = JSON.parse(text.slice(text.indexOf('{'))) as PortableSystem
  const chunk = parsed.cssChunks[0]
  if (!chunk) throw new Error('portable base system carries no css chunk')
  // A blank same-origin frame stands in for the downstream layers-mode
  // consumer: it carries the portable chunk alone, so any resolved var
  // proves the chunk is self-sufficient and the scoping did the work —
  // the main document's :root tokens cannot leak in.
  const frame = document.createElement('iframe')
  frame.id = 'portable'
  frame.title = 'portable consumer'
  document.body.appendChild(frame)
  const inner = frame.contentDocument
  if (!inner) throw new Error('portable frame has no document')
  const style = inner.createElement('style')
  style.textContent = chunk.css
  inner.head.appendChild(style)
  const player = inner.createElement('div')
  player.id = 'iplayer'
  player.textContent = 'portable layer probe'
  player.setAttribute('data-layer', 'neo-layer2')
  inner.body.appendChild(player)
  const stranger = inner.createElement('div')
  stranger.id = 'istranger'
  stranger.textContent = 'portable stranger probe'
  stranger.setAttribute('data-layer', 'stranger')
  inner.body.appendChild(stranger)
}

await injectPortable()
