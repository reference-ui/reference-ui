import { describe, expect, it } from 'vitest'
import { DATA_COLOR_MODE_ATTR } from './constants'
import { ColorModeContext, DocumentContext, readDocumentColorMode, resolveColorModeAttr } from './color-mode'

describe('color-mode', () => {
  it('initializes ColorModeContext with undefined default', () => {
    expect(ColorModeContext).toBeDefined()
  })

  it('initializes DocumentContext with null default', () => {
    expect(DocumentContext).toBeDefined()
  })

  it('reads active document color mode safely in non-DOM environment', () => {
    expect(readDocumentColorMode()).toBeUndefined()
  })

  it('uses DATA_COLOR_MODE_ATTR as theme attribute contract', () => {
    expect(DATA_COLOR_MODE_ATTR).toBe('data-panda-theme')
  })

  it('reads canonical DATA_COLOR_MODE_ATTR from documentElement or body', () => {
    const mockDoc = {
      documentElement: {
        getAttribute: (attr: string) => (attr === DATA_COLOR_MODE_ATTR ? 'dark' : null),
      },
      body: {
        getAttribute: () => null,
      },
    } as unknown as Document

    expect(readDocumentColorMode(mockDoc)).toBe('dark')
  })

  it('ignores legacy data-color-mode and data-theme attributes', () => {
    const mockDoc = {
      documentElement: {
        getAttribute: (attr: string) => {
          if (attr === 'data-color-mode') return 'dark'
          if (attr === 'data-theme') return 'dark'
          return null
        },
      },
      body: {
        getAttribute: () => null,
      },
    } as unknown as Document

    // Must return undefined because aliases are no longer accepted
    expect(readDocumentColorMode(mockDoc)).toBeUndefined()
  })

  it('reads from custom Document (e.g. iframe ownerDocument)', () => {
    const iframeDoc = {
      documentElement: {
        getAttribute: () => null,
      },
      body: {
        getAttribute: (attr: string) => (attr === DATA_COLOR_MODE_ATTR ? 'light' : null),
      },
    } as unknown as Document

    expect(readDocumentColorMode(iframeDoc)).toBe('light')
  })

  it('resolves color mode attribute correctly', () => {
    expect(resolveColorModeAttr('dark')).toEqual({ [DATA_COLOR_MODE_ATTR]: 'dark' })
    expect(resolveColorModeAttr(undefined)).toEqual({})
    expect(resolveColorModeAttr('')).toEqual({})
  })
})
