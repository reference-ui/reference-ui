import { describe, it, expect } from 'vitest'
import { buttonPrimitiveStyles } from './button'
import { inputPrimitiveStyles } from './inputs'
import { sliderThumb, sliderTrack } from '../shared'

describe('button variants, file upload, and slider single source of truth', () => {
  it('defines default button variant as neutral outline', () => {
    const defaultSelector =
      '.ref-button:where([data-variant="default"], :not([data-variant]))'
    const defaultStyles = (buttonPrimitiveStyles as any)[defaultSelector]

    expect(defaultStyles).toBeDefined()
    expect(defaultStyles.backgroundColor).toBe('{colors.ui.table.row.mutedBackground}')
    expect(defaultStyles.color).toBe('{colors.design.text.base}')
    expect(defaultStyles.borderColor).toBe('{colors.ui.field.border}')
  })

  it('defines primary button variant as high-contrast CTA', () => {
    const primarySelector = '.ref-button:where([data-variant="primary"])'
    const primaryStyles = (buttonPrimitiveStyles as any)[primarySelector]

    expect(primaryStyles).toBeDefined()
    expect(primaryStyles.backgroundColor).toBe('{colors.ui.button.background}')
    expect(primaryStyles.color).toBe('{colors.ui.button.foreground}')
  })

  it('defines ghost button variant with transparent background and no expanding outline on active', () => {
    const ghostSelector = '.ref-button:where([data-variant="ghost"])'
    const ghostStyles = (buttonPrimitiveStyles as any)[ghostSelector]

    expect(ghostStyles).toBeDefined()
    expect(ghostStyles.backgroundColor).toBe('transparent')
    expect(ghostStyles.borderColor).toBe('transparent')
    // Active state must NOT have expanding outline halo
    expect(ghostStyles._active).toBeDefined()
    expect(ghostStyles._active.boxShadow).toBe('none')
  })

  it('aligns native file upload button with secondary/default button palette', () => {
    const fileSelector = '.ref-input[type="file"]'
    const fileStyles = (inputPrimitiveStyles as any)[fileSelector]?._file

    expect(fileStyles).toBeDefined()
    expect(fileStyles.backgroundColor).toBe('{colors.ui.table.row.mutedBackground}')
    expect(fileStyles.color).toBe('{colors.design.text.base}')
    expect(fileStyles.borderColor).toBe('{colors.ui.field.border}')
  })

  it('preserves focus ring on hover for focused inputs and field focus parity', () => {
    const inputSelector =
      '.ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), .ref-select, .ref-textarea'
    const inputStyles = (inputPrimitiveStyles as any)[inputSelector]

    expect(inputStyles).toBeDefined()
    expect(inputStyles['&:focus:hover']?.borderColor).toBe('{colors.ui.focus.ring}')
    expect(inputStyles['&:focus']?.borderColor).toBe('{colors.ui.focus.ring}')
    expect(inputStyles['&[data-focus-visible]:focus']?.outlineColor).toBe('{colors.ui.focus.ring}')
    expect(inputStyles['&[data-focus-visible]:focus']?.borderColor).toBe('{colors.ui.field.borderHover}')
  })

  it('shares single source of truth for slider track and DSP rounded rectangle thumb', () => {
    const trackStyles = (inputPrimitiveStyles as any)['.ref-input[type="range"]::-webkit-slider-runnable-track']
    const thumbStyles = (inputPrimitiveStyles as any)['.ref-input[type="range"]::-webkit-slider-thumb']

    expect(trackStyles).toBeDefined()
    expect(trackStyles.height).toBe(sliderTrack.height)

    expect(thumbStyles).toBeDefined()
    expect(thumbStyles.width).toBe(sliderThumb.lengthPx)
    expect(thumbStyles.height).toBe(sliderThumb.crossPx)
    expect(thumbStyles.borderRadius).toBe(sliderThumb.borderRadius)
  })
})
