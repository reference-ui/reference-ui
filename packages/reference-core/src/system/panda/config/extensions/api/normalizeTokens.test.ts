import { describe, expect, it } from 'vitest'
import { normalizeTokenFragments } from './normalizeTokens'

describe('normalizeTokenFragments()', () => {
  it('splits value/light/dark token leaves into base tokens and theme overrides', () => {
    const normalized = normalizeTokenFragments([
      {
        colors: {
          text: {
            value: '{colors.gray.950}',
            dark: '{colors.gray.50}',
            description: 'Primary text color',
          },
          surface: {
            value: '{colors.white}',
            dark: '{colors.gray.950}',
          },
          accent: {
            value: '{colors.blue.600}',
            light: '{colors.blue.700}',
            dark: '{colors.blue.300}',
          },
        },
        spacing: {
          sm: {
            value: '0.5rem',
          },
        },
      },
    ])

    expect(normalized.baseTokens).toEqual({
      colors: {
        text: {
          value: '{colors.gray.950}',
          description: 'Primary text color',
        },
        surface: {
          value: '{colors.white}',
        },
        accent: {
          value: '{colors.blue.600}',
        },
      },
      spacing: {
        sm: {
          value: '0.5rem',
        },
      },
    })

    expect(normalized.themes).toEqual({
      light: {
        tokens: {
          colors: {
            accent: {
              value: '{colors.blue.700}',
            },
          },
        },
      },
      dark: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.50}',
              description: 'Primary text color',
            },
            surface: {
              value: '{colors.gray.950}',
            },
            accent: {
              value: '{colors.blue.300}',
            },
          },
        },
      },
    })
  })

  it('merges themed overrides across multiple fragments', () => {
    const normalized = normalizeTokenFragments([
      {
        colors: {
          text: {
            value: '{colors.gray.950}',
            dark: '{colors.gray.50}',
          },
        },
      },
      {
        colors: {
          border: {
            value: '{colors.gray.200}',
            dark: '{colors.gray.700}',
          },
        },
      },
    ])

    expect(normalized.baseTokens).toEqual({
      colors: {
        text: {
          value: '{colors.gray.950}',
        },
        border: {
          value: '{colors.gray.200}',
        },
      },
    })

    expect(normalized.themes).toEqual({
      dark: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.50}',
            },
            border: {
              value: '{colors.gray.700}',
            },
          },
        },
      },
    })
  })
})
