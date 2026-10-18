// Entry for the NEO-LAYER-02 world. It takes the three static probes and the
// served portable base system, paints the mixed, recipe-only, and adopted
// nodes synchronously, then fetches the published streams, reprints the own
// portable sheet, injects it into a blank consumer frame, and creates the two
// data-layer probes inside — so the frame's existence proves the injection it
// depends on already landed.
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

interface StreamEntry {
  name: string
  preamble: string
  reset?: string
  global?: string
  tokensPortable?: string
  recipes?: string
  utilities?: string
  package?: string
}

interface PortableSystem {
  streams?: StreamEntry[]
}

// Own-portable reprint: the consumer's own reset rides alongside its portable
// tokens, mirroring mergeStreams' own-portable join. Escape-free on purpose —
// this world's package name needs no CSS escaping, and mergeStreams owns the
// escaping port.
function reprintPortable(own: StreamEntry): string {
  const inner =
    own.preamble +
    (own.reset ?? '') +
    (own.global ?? '') +
    (own.tokensPortable ?? '') +
    (own.recipes ?? '') +
    (own.utilities ?? '')
  const pkg = own.package ?? ''
  if (pkg === '') return inner
  return `@layer ${pkg} {\n${inner}}\n`
}

async function injectPortable(): Promise<void> {
  const response = await fetch('./.reference-ui/system/baseSystem.mjs')
  if (!response.ok) throw new Error(`portable fetch failed: HTTP ${response.status}`)
  const text = await response.text()
  const parsed = JSON.parse(text.slice(text.indexOf('{'))) as PortableSystem
  // S5 carriage is guaranteed: sync always publishes at least the own entry,
  // so missing streams is a real failure, never a transient to skip.
  if (parsed.streams === undefined || parsed.streams.length === 0) {
    throw new Error('published base system carries no streams')
  }
  const portableCss = reprintPortable(parsed.streams[parsed.streams.length - 1])
  if (portableCss.length === 0) throw new Error('portable base system reprints empty')
  // A blank same-origin frame stands in for the downstream layers-mode
  // consumer: it carries the portable css alone, so any resolved var
  // proves the css is self-sufficient and the scoping did the work —
  // the main document's :root tokens cannot leak in.
  const frame = document.createElement('iframe')
  frame.id = 'portable'
  frame.title = 'portable consumer'
  document.body.appendChild(frame)
  const inner = frame.contentDocument
  if (!inner) throw new Error('portable frame has no document')
  const style = inner.createElement('style')
  style.textContent = portableCss
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
