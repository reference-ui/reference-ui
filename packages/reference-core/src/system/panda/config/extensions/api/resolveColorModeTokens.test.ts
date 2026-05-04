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
        accent: {
          value: '{colors.blue.700}',
        },
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

  it('prefers the explicit light/dark pair over value and emits a light base token', () => {
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

  it('treats light/dark keys whose value is an object as nested groups, not mode slots (e.g. tier name `light`)', () => {
    const resolved = resolveColorModeTokens([
      {
        design: {
          text: {
            base: { light: '{colors.gray.800}', dark: '{colors.gray.50}' },
            light: { light: '{colors.gray.700}', dark: '{colors.gray.300}' },
            lighter: { light: '{colors.gray.600}', dark: '{colors.gray.400}' },
          },
        },
      },
    ])

    expect(resolved.themes.light?.tokens).toEqual({
      design: {
        text: {
          base: { value: '{colors.gray.800}' },
          light: { value: '{colors.gray.700}' },
          lighter: { value: '{colors.gray.600}' },
        },
      },
    })
    expect(resolved.themes.dark?.tokens).toEqual({
      design: {
        text: {
          base: { value: '{colors.gray.50}' },
          light: { value: '{colors.gray.300}' },
          lighter: { value: '{colors.gray.400}' },
        },
      },
    })
    expect(resolved.baseTokens).toEqual({
      design: {
        text: {
          base: { value: '{colors.gray.800}' },
          light: { value: '{colors.gray.700}' },
          lighter: { value: '{colors.gray.600}' },
        },
      },
    })
  })

  describe('private tokens', () => {
    const UPSTREAM_SOURCE = 'upstream system fragment'
    const FRAGMENT_SOURCE_PROPERTY = '__refConfigFragmentSource'

    function withSource<T extends object>(value: T, source: string): T {
      Object.defineProperty(value, FRAGMENT_SOURCE_PROPERTY, {
        configurable: true,
        enumerable: false,
        value: source,
      })
      return value
    }

    it('preserves _private tokens from local fragments', () => {
      const localFragment = withSource(
        {
          colors: {
            brand: { value: '#0066cc' },
            _private: {
              internalAccent: { value: '#FF00FF' },
            },
          },
        },
        'src/tokens.ts',
      )

      const resolved = resolveColorModeTokens([localFragment])

      expect(resolved.baseTokens).toEqual({
        colors: {
          brand: { value: '#0066cc' },
          _private: {
            internalAccent: { value: '#FF00FF' },
          },
        },
      })
    })

    it('strips _private tokens from upstream system fragments', () => {
      const upstreamFragment = withSource(
        {
          colors: {
            brand: { value: '#0066cc' },
            _private: {
              internalAccent: { value: '#FF00FF' },
            },
          },
        },
        UPSTREAM_SOURCE,
      )

      const resolved = resolveColorModeTokens([upstreamFragment])

      expect(resolved.baseTokens).toEqual({
        colors: {
          brand: { value: '#0066cc' },
        },
      })
    })

    it('strips deeply nested _private subtrees from upstream fragments', () => {
      const upstreamFragment = withSource(
        {
          colors: {
            brand: {
              primary: { value: '#0066cc' },
              _private: {
                hovered: { value: '#003366' },
              },
            },
          },
          spacing: {
            _private: {
              gutter: { value: '0.5rem' },
            },
          },
        },
        UPSTREAM_SOURCE,
      )

      const resolved = resolveColorModeTokens([upstreamFragment])

      expect(resolved.baseTokens).toEqual({
        colors: {
          brand: {
            primary: { value: '#0066cc' },
          },
        },
      })
    })

    it('keeps local _private alongside upstream fragments where _private is stripped', () => {
      const upstreamFragment = withSource(
        {
          colors: {
            _private: { secret: { value: '#000000' } },
          },
        },
        UPSTREAM_SOURCE,
      )
      const localFragment = withSource(
        {
          colors: {
            _private: { local: { value: '#FFFFFF' } },
          },
        },
        'src/local.ts',
      )

      const resolved = resolveColorModeTokens([upstreamFragment, localFragment])

      expect(resolved.baseTokens).toEqual({
        colors: {
          _private: { local: { value: '#FFFFFF' } },
        },
      })
    })
  })
})
