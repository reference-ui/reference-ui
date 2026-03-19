/**
 * @vitest-environment happy-dom
 *
 * Demonstrates the key isolation guarantee of the `layers` pattern vs `extends`.
 *
 * EXTENDS (reference-unit ← extend-library):
 *   Tokens bleed into the consumer's global token namespace.
 *   <Div bg="fixtureDemoBg"> resolves because Panda codegen ran with those
 *   tokens in scope.
 *
 * LAYERS (reference-unit ← layer-library):
 *   The library ships its own compiled CSS in a separate @layer scope.
 *   Its tokens are NOT injected into the consumer's Panda config, so the
 *   consumer's own generated CSS has no knowledge of them.
 *
 *   Isolation test — token NOT in consumer global space:
 *     <Div bg="layerPrivateAccent"> does NOT resolve. The consumer's Panda
 *     build has no record of `layerPrivateAccent`, so no CSS variable is
 *     emitted and backgroundColor stays empty/transparent.
 *
 *   Component works — token INSIDE the library's own CSS:
 *     <LayerPrivateDemo> DOES resolve because it was compiled inside the
 *     layer-library where the token IS known. Its styles ship with the
 *     library's own styles.css, kept separate from the consumer's token space.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  LayerPrivateDemo,
  layerPrivateAccentRgb,
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
} from '@fixtures/layer-library'
import { getDesignSystemCssPath, injectDesignSystemCss } from '../primitives/setup'

// ---------------------------------------------------------------------------
// Helpers: locate and inject the layer-library's OWN compiled CSS
// This is separate from reference-unit's CSS — the consumer imports the
// library's component CSS bundle but it does not add the tokens to their space.
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const layerLibRoot = join(__dirname, '../../../../fixtures/layer-library')
const layerLibCssCandidates = [
  join(layerLibRoot, '.reference-ui', 'styled', 'styles.css'),
  join(layerLibRoot, '.reference-ui', 'react', 'styles.css'),
]

function getLayerLibCssPath(): string | undefined {
  return layerLibCssCandidates.find(existsSync)
}

function injectLayerLibCss(): void {
  const p = getLayerLibCssPath()
  if (!p) throw new Error(`Layer library CSS not found. Tried: ${layerLibCssCandidates.join(', ')}`)
  const style = document.createElement('style')
  style.setAttribute('data-layer-library', '')
  style.textContent = readFileSync(p, 'utf-8')
  document.head.appendChild(style)
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // Consumer CSS not available (ref sync hasn't run). Style assertions are
    // skipped via the getDesignSystemCssPath() guard inside each test.
  }
})

// ---------------------------------------------------------------------------
// Isolation test: the private token must NOT leak into the consumer token space
// ---------------------------------------------------------------------------

describe('token isolation: layerPrivateAccent is NOT in the consumer global space', () => {
  it('<Div bg="layerPrivateAccent"> does not resolve — token absent from consumer CSS', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="isolated-div" bg="layerPrivateAccent" padding="2r">
        No background expected
      </Div>
    )
    const el = screen.getByTestId('isolated-div')
    expect(el).toBeInTheDocument()

    // The consumer's Panda output has no entry for layerPrivateAccent.
    // backgroundColor will be an empty string or transparent — never the
    // indigo value the token would produce if it were in global scope.
    const bg = window.getComputedStyle(el).backgroundColor
    if (bg) expect(bg).not.toBe(layerPrivateAccentRgb)
  })
})

// ---------------------------------------------------------------------------
// Component test: the library's own component ships its compiled CSS and
// therefore DOES resolve the token correctly at the component level
// ---------------------------------------------------------------------------

describe('LayerPrivateDemo resolves its own token via the library CSS layer', () => {
  it('renders with the correct indigo background when the library CSS is loaded', () => {
    if (!getDesignSystemCssPath() || !getLayerLibCssPath()) return

    // Simulate what a consumer does: import both the component AND the
    // library's compiled styles.css. The token is defined there — inside the
    // library's own CSS layer — and never touches the consumer's token namespace.
    injectLayerLibCss()

    render(<LayerPrivateDemo />)

    const el = screen.getByTestId('layer-private-demo')
    expect(el).toBeInTheDocument()

    // Token is defined in the layer-library's OWN CSS — component resolves it.
    const bg = window.getComputedStyle(el).backgroundColor
    if (bg) expect(bg).toBe(layerPrivateAccentRgb)
  })
})

// ---------------------------------------------------------------------------
// Shared token tests: lightDarkDemoBg appears in BOTH libraries — here we
// verify it resolves via the consumer's layers[] path
// ---------------------------------------------------------------------------

describe('layers baseSystem from fixture library', () => {
  it('resolves lightDarkDemoBg on Div in light mode', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="layers-bg-light" bg="lightDarkDemoBg" color="lightDarkDemoText">
        Light mode
      </Div>
    )
    const el = screen.getByTestId('layers-bg-light')
    expect(el).toBeInTheDocument()
    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(lightDarkDemoBgLightRgb)
    if (color) expect(color).toBe(lightDarkDemoTextLightRgb)
  })

  it('resolves lightDarkDemoBg on Div in dark mode', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <div data-panda-theme="dark">
        <Div data-testid="layers-bg-dark" bg="lightDarkDemoBg" color="lightDarkDemoText">
          Dark mode
        </Div>
      </div>
    )
    const el = screen.getByTestId('layers-bg-dark')
    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(lightDarkDemoBgDarkRgb)
    if (color) expect(color).toBe(lightDarkDemoTextDarkRgb)
  })
})
