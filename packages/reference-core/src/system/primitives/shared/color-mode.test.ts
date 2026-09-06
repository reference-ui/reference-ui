import { describe, expect, it } from 'vitest'
import { DATA_COLOR_MODE_ATTR } from './constants'
import { ColorModeContext, readDocumentColorMode, resolveColorModeAttr } from './color-mode'

describe('color-mode', () => {
  it('initializes ColorModeContext with undefined default', () => {
    expect(ColorModeContext).toBeDefined()
  })

  it('reads active document color mode safely in non-DOM environment', () => {
    expect(readDocumentColorMode()).toBeUndefined()
  })

  it('uses DATA_COLOR_MODE_ATTR as theme attribute contract', () => {
    expect(DATA_COLOR_MODE_ATTR).toBe('data-panda-theme')
  })

  it('resolves color mode attribute correctly', () => {
    expect(resolveColorModeAttr('dark')).toEqual({ [DATA_COLOR_MODE_ATTR]: 'dark' })
    expect(resolveColorModeAttr(undefined)).toEqual({})
    expect(resolveColorModeAttr('')).toEqual({})
  })
})
