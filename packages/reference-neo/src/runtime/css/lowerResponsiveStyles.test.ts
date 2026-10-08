// Unit tests for the Neo responsive lowering over author style objects.
// They take r sugar plus plain shapes and assert the lowered container forms.
// The family mirrors the core runtime lowering assertions, minus Panda mocks.

import { describe, expect, it } from 'vitest'
import { lowerResponsiveStyles } from './lowerResponsiveStyles.ts'

describe('lowerResponsiveStyles', () => {
  it('lowers numeric r breakpoints to container queries', () => {
    expect(
      lowerResponsiveStyles({
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
      })
    ).toEqual({
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

  it('lowers lists of style objects elementwise', () => {
    expect(lowerResponsiveStyles([{ r: { 480: { gap: '3r' } } }, { gap: '2r' }])).toEqual([
      { '@container (min-width: 480px)': { gap: '3r' } },
      { gap: '2r' },
    ])
  })

  it('leaves unsupported responsive shapes untouched', () => {
    const named = { r: { sidebar: { padding: '2r' } } }
    expect(lowerResponsiveStyles(named)).toBe(named)

    const scalar = { r: '320' }
    expect(lowerResponsiveStyles(scalar)).toBe(scalar)

    const empty = { r: {} }
    expect(lowerResponsiveStyles(empty)).toBe(empty)
  })

  it('preserves arbitrary selectors and returns clean shapes as-is', () => {
    const styles = {
      borderWidth: '2px',
      '&[data-component=card]:hover': {
        borderTopWidth: '6px',
      },
    }

    expect(lowerResponsiveStyles(styles)).toBe(styles)
    expect(lowerResponsiveStyles('color')).toBe('color')
    expect(lowerResponsiveStyles(null)).toBe(null)
  })
})
