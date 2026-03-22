import { describe, expect, it } from 'vitest'
import { resolveColorModeTokens } from './resolveColorModeTokens'

describe('resolveColorModeTokens()', () => {
  it('treats value as the default mode and keeps explicit light and dark overrides', () => {
    const resolved = resolveColorModeTokens([
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

    expect(resolved.baseTokens).toEqual({
      colors: {
        text: {
          value: '{colors.gray.950}',
          description: 'Primary text color',
        },
        surface: {
          value: '{colors.white}',
        },
      },
      spacing: {
        sm: {
          value: '0.5rem',
        },
      },
    })

    expect(resolved.themes).toEqual({
      light: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.950}',
              description: 'Primary text color',
            },
            surface: {
              value: '{colors.white}',
            },
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

  it('prefers the explicit light/dark pair over value and does not emit a base token', () => {
    const resolved = resolveColorModeTokens([
      {
        colors: {
          accent: {
            value: '{colors.blue.600}',
            light: '{colors.blue.700}',
            dark: '{colors.blue.300}',
          },
          text: {
            light: '{colors.gray.950}',
            dark: '{colors.gray.50}',
            description: 'Explicit mode pair',
          },
          icon: {
            light: '{colors.gray.700}',
          },
          border: {
            dark: '{colors.gray.700}',
          },
        },
      },
    ])

    expect(resolved.baseTokens).toEqual({
      colors: {
        icon: {
          value: '{colors.gray.700}',
        },
        border: {
          value: '{colors.gray.700}',
        },
      },
    })

    expect(resolved.themes).toEqual({
      light: {
        tokens: {
          colors: {
            accent: {
              value: '{colors.blue.700}',
            },
            text: {
              value: '{colors.gray.950}',
              description: 'Explicit mode pair',
            },
            icon: {
              value: '{colors.gray.700}',
            },
          },
        },
      },
      dark: {
        tokens: {
          colors: {
            accent: {
              value: '{colors.blue.300}',
            },
            text: {
              value: '{colors.gray.50}',
              description: 'Explicit mode pair',
            },
            border: {
              value: '{colors.gray.700}',
            },
          },
        },
      },
    })
  })

  it('treats single light-only and dark-only tokens as base tokens too', () => {
    const resolved = resolveColorModeTokens([
      {
        colors: {
          body: {
            value: '{colors.gray.950}',
          },
          muted: {
            light: '{colors.gray.600}',
          },
          inverse: {
            dark: '{colors.white}',
          },
        },
      },
    ])

    expect(resolved.baseTokens).toEqual({
      colors: {
        body: {
          value: '{colors.gray.950}',
        },
        muted: {
          value: '{colors.gray.600}',
        },
        inverse: {
          value: '{colors.white}',
        },
      },
    })

    expect(resolved.themes).toEqual({
      light: {
        tokens: {
          colors: {
            muted: {
              value: '{colors.gray.600}',
            },
          },
        },
      },
      dark: {
        tokens: {
          colors: {
            inverse: {
              value: '{colors.white}',
            },
          },
        },
      },
    })
  })

  it('merges themed overrides across multiple fragments', () => {
    const resolved = resolveColorModeTokens([
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

    expect(resolved.baseTokens).toEqual({
      colors: {
        text: {
          value: '{colors.gray.950}',
        },
        border: {
          value: '{colors.gray.200}',
        },
      },
    })

    expect(resolved.themes).toEqual({
      light: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.950}',
            },
            border: {
              value: '{colors.gray.200}',
            },
          },
        },
      },
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

  it('treats value + dark as default light plus explicit light and dark theme tokens', () => {
    const resolved = resolveColorModeTokens([
      {
        colors: {
          text: {
            value: '{colors.gray.950}',
            dark: '{colors.gray.50}',
          },
        },
      },
    ])

    expect(resolved.baseTokens).toEqual({
      colors: {
        text: {
          value: '{colors.gray.950}',
        },
      },
    })

    expect(resolved.themes).toEqual({
      light: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.950}',
            },
          },
        },
      },
      dark: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.50}',
            },
          },
        },
      },
    })
  })

  it('treats value + light as default dark plus explicit dark and light theme tokens', () => {
    const resolved = resolveColorModeTokens([
      {
        colors: {
          text: {
            value: '{colors.gray.50}',
            light: '{colors.gray.950}',
          },
        },
      },
    ])

    expect(resolved.baseTokens).toEqual({
      colors: {
        text: {
          value: '{colors.gray.50}',
        },
      },
    })

    expect(resolved.themes).toEqual({
      light: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.950}',
            },
          },
        },
      },
      dark: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.50}',
            },
          },
        },
      },
    })
  })
})
