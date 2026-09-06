// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { Slider } from './Slider'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Slider component geometry and DSP fader cap parity', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'slider-root'
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('renders horizontal slider with rounded rectangle thumb wider in travel direction', async () => {
    await React.act(async () => {
      root.render(
        <Slider defaultValue={[50]} orientation="horizontal" id="h-slider">
          <Slider.Track id="h-track">
            <Slider.Range id="h-range" />
          </Slider.Track>
          <Slider.Thumb id="h-thumb" />
        </Slider>
      )
    })

    const rootEl = document.getElementById('h-slider')
    const trackEl = document.getElementById('h-track')
    const thumbEl = document.getElementById('h-thumb')

    expect(rootEl?.getAttribute('data-orientation')).toBe('horizontal')
    expect(trackEl?.style.height).toBe('6px')
    expect(trackEl?.style.width).toBe('100%')

    // DSP fader cap: horizontal thumb is wider (24px) than it is tall (16px) with rounded rect border radius (4px)
    expect(thumbEl?.style.width).toBe('24px')
    expect(thumbEl?.style.height).toBe('16px')
    expect(thumbEl?.style.borderRadius).toBe('4px')
  })

  it('renders vertical slider with 6px thin track, bottom-to-top range fill, and taller vertical thumb', async () => {
    await React.act(async () => {
      root.render(
        <Slider defaultValue={[40]} orientation="vertical" id="v-slider">
          <Slider.Track id="v-track">
            <Slider.Range id="v-range" />
          </Slider.Track>
          <Slider.Thumb id="v-thumb" />
        </Slider>
      )
    })

    const rootEl = document.getElementById('v-slider')
    const trackEl = document.getElementById('v-track')
    const rangeEl = document.getElementById('v-range')
    const thumbEl = document.getElementById('v-thumb')

    expect(rootEl?.getAttribute('data-orientation')).toBe('vertical')
    expect(trackEl?.getAttribute('data-orientation')).toBe('vertical')
    expect(trackEl?.style.width).toBe('6px')
    expect(trackEl?.style.height).toBe('100%')

    // DSP fader cap: vertical thumb is taller (24px) than it is wide (16px) with rounded rect border radius (4px)
    expect(thumbEl?.style.width).toBe('16px')
    expect(thumbEl?.style.height).toBe('24px')
    expect(thumbEl?.style.borderRadius).toBe('4px')

    // Vertical range fills from bottom
    expect(rangeEl?.style.bottom).toBe('0%')
    expect(rangeEl?.style.height).toBe('40%')

    // Thumb has ARIA attributes
    expect(thumbEl?.getAttribute('role')).toBe('slider')
    expect(thumbEl?.getAttribute('aria-valuenow')).toBe('40')
    expect(thumbEl?.getAttribute('aria-orientation')).toBe('vertical')
  })
})
