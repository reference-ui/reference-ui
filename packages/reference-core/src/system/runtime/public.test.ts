import { describe, expect, it, vi } from 'vitest'
import type { CssStyles } from '../../types'

const { styledCssMock, styledCssRawMock } = vi.hoisted(() => ({
  styledCssMock: vi.fn(() => 'generated-class'),
  styledCssRawMock: vi.fn((...styles: unknown[]) => styles[0]),
}))

vi.mock('@reference-ui/styled/css', () => {
  const css = Object.assign(styledCssMock, {
    raw: styledCssRawMock,
  })

  return { css }
})

vi.mock('@reference-ui/styled/css/cva', () => ({
  cva: vi.fn(),
}))

import { css } from '.'

describe('system/runtime css runtime lowering', () => {
  it('preserves arbitrary same-element selectors when delegating css()', () => {
    const styles = {
      borderWidth: '2px',
      '&[data-component=card]:hover': {
        borderTopWidth: '6px',
      },
    } as unknown as CssStyles

    const className = css(styles)

    expect(className).toBe('generated-class')
    expect(styledCssMock).toHaveBeenCalledWith({
      borderWidth: '2px',
      '&[data-component=card]:hover': {
        borderTopWidth: '6px',
      },
    })
  })

  it('lowers responsive r sugar before delegating css()', () => {
    const className = css({
      display: 'grid',
      r: {
        320: { padding: '2r' },
        640: {
          _hover: {
            r: {
              960: { color: 'red.500' },
            },
          },
        },
      },
    } as unknown as CssStyles)

    expect(className).toBe('generated-class')
    expect(styledCssMock).toHaveBeenCalledWith({
      display: 'grid',
      '@container (min-width: 320px)': {
        padding: '2r',
      },
      '@container (min-width: 640px)': {
        _hover: {
          '@container (min-width: 960px)': {
            color: 'red.500',
          },
        },
      },
    })
  })

  it('lowers responsive r sugar before delegating css.raw()', () => {
    const styles = css.raw({
      gap: '2r',
      r: {
        480: { gap: '3r' },
      },
    } as unknown as CssStyles)

    expect(styles).toEqual({
      gap: '2r',
      '@container (min-width: 480px)': {
        gap: '3r',
      },
    })
    expect(styledCssRawMock).toHaveBeenCalledWith({
      gap: '2r',
      '@container (min-width: 480px)': {
        gap: '3r',
      },
    })
  })

  it('leaves unsupported responsive shapes untouched', () => {
    const invalid = {
      r: {
        sidebar: { padding: '2r' },
      },
    } as unknown as CssStyles

    css(invalid)

    expect(styledCssMock).toHaveBeenLastCalledWith(invalid)
  })
})