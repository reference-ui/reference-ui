import { describe, expect, it } from 'vitest'
import { flattenTokenFragments } from './tokens'

describe('mcp token projection', () => {
  it('flattens token fragments and preserves descriptions', () => {
    expect(
      flattenTokenFragments([
        {
          colors: {
            text: {
              value: '#111111',
              dark: '#f5f5f5',
              description: 'Primary text color',
            },
          },
          spacing: {
            md: { value: '1rem' },
          },
        },
      ])
    ).toEqual([
      {
        path: 'colors.text',
        category: 'colors',
        value: '#111111',
        dark: '#f5f5f5',
        description: 'Primary text color',
      },
      {
        path: 'spacing.md',
        category: 'spacing',
        value: '1rem',
      },
    ])
  })
})
