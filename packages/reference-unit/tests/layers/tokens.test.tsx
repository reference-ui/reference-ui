/**
 * @vitest-environment happy-dom
 *
 * Layers keep library-private tokens out of the consumer token space, while
 * still allowing explicitly layered public tokens to resolve where the consumer
 * is supposed to see them. Color-mode propagation is covered separately in
 * `tests/color-mode/data-prop.test.tsx`.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  LayerPrivateDemo,
  layerPrivateAccentRgb,
  lightDarkDemoBgLightRgb,
  lightDarkDemoTextLightRgb,
} from '@fixtures/layer-library'
import {
  flattenCssCascadeLayersForTests,
  injectDesignSystemCss,
} from '../primitives/setup'
import {
  expectNotResolvedRgb,
  expectResolvedRgb,
  requireDesignSystemCss,
} from '../utils/design-system-css'

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
  if (!p)
    throw new Error(
      `Layer library CSS not found. Tried: ${layerLibCssCandidates.join(', ')}`,
    )
  const style = document.createElement('style')
  style.setAttribute('data-layer-library', '')
  style.textContent = flattenCssCascadeLayersForTests(readFileSync(p, 'utf-8'))
  document.head.appendChild(style)
}

beforeAll(() => {
  requireDesignSystemCss()
  injectDesignSystemCss({ flattenCascadeLayers: true })
})

describe('layer-private token isolation', () => {
  it('consumer primitive does not resolve a guessed private layer token by name', () => {
    render(
      <Div data-testid="isolated-div" bg="layerPrivateAccent" padding="2r">
        No background expected
      </Div>,
    )
    const el = screen.getByTestId('isolated-div')
    expectNotResolvedRgb(
      el,
      'backgroundColor',
      layerPrivateAccentRgb,
      'consumer primitive should not resolve guessed private layer token',
    )
  })
})

describe('layer-authored markup keeps access to private tokens', () => {
  it('layered component resolves its own private token when library CSS is loaded', () => {
    if (!getLayerLibCssPath()) {
      throw new Error(
        `Layer library CSS not found. Tried: ${layerLibCssCandidates.join(', ')}`,
      )
    }
    injectLayerLibCss()
    render(<LayerPrivateDemo />)

    const el = screen.getByTestId('layer-private-demo')
    expectResolvedRgb(el, 'backgroundColor', layerPrivateAccentRgb, 'layered component resolves its private token')
  })
})

describe('layered public tokens available to consumer primitives', () => {
  it('consumer primitive resolves layered public background and text tokens in light mode', () => {
    render(
      <Div data-testid="layers-bg-light" bg="lightDarkDemoBg" color="lightDarkDemoText">
        Light mode
      </Div>,
    )
    const el = screen.getByTestId('layers-bg-light')
    expectResolvedRgb(
      el,
      'backgroundColor',
      lightDarkDemoBgLightRgb,
      'consumer primitive resolves layered public background token',
    )
    expectResolvedRgb(
      el,
      'color',
      lightDarkDemoTextLightRgb,
      'consumer primitive resolves layered public text token',
    )
  })
})
