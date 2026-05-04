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

  it('hides _private token subtrees from upstream system fragments', () => {
    const upstreamFragment = {
      colors: {
        text: { value: '#111111' },
        _private: {
          internalAccent: { value: '#FF00FF' },
        },
        brand: {
          primary: { value: '#0066cc' },
          _private: {
            hovered: { value: '#003366' },
          },
        },
      },
    }
    Object.defineProperty(upstreamFragment, '__refConfigFragmentSource', {
      configurable: true,
      enumerable: false,
      value: 'upstream system fragment',
    })

    expect(flattenTokenFragments([upstreamFragment])).toEqual([
      {
        path: 'colors.brand.primary',
        category: 'colors',
        value: '#0066cc',
      },
      {
        path: 'colors.text',
        category: 'colors',
        value: '#111111',
      },
    ])
  })

  it('preserves _private token subtrees authored by local fragments', () => {
    // Local fragments are MCP-visible because the MCP server is part of the
    // package's own toolchain. Privacy applies at the downstream boundary,
    // not against the package that owns the token.
    const localFragment = {
      colors: {
        text: { value: '#111111' },
        _private: {
          internalAccent: { value: '#FF00FF' },
        },
      },
    }
    Object.defineProperty(localFragment, '__refConfigFragmentSource', {
      configurable: true,
      enumerable: false,
      value: '/abs/path/to/local-fragment.ts',
    })

    expect(flattenTokenFragments([localFragment])).toEqual([
      {
        path: 'colors._private.internalAccent',
        category: 'colors',
        value: '#FF00FF',
      },
      {
        path: 'colors.text',
        category: 'colors',
        value: '#111111',
      },
    ])
  })

  it('strips _private from upstream while keeping local _private alongside', () => {
    const upstreamFragment = {
      colors: {
        upstreamPublic: { value: '#222222' },
        _private: {
          upstreamSecret: { value: '#000000' },
        },
      },
    }
    Object.defineProperty(upstreamFragment, '__refConfigFragmentSource', {
      configurable: true,
      enumerable: false,
      value: 'upstream system fragment',
    })

    const localFragment = {
      colors: {
        localPublic: { value: '#FFFFFF' },
        _private: {
          localSecret: { value: '#AAAAAA' },
        },
      },
    }
    Object.defineProperty(localFragment, '__refConfigFragmentSource', {
      configurable: true,
      enumerable: false,
      value: '/abs/path/to/local-fragment.ts',
    })

    const tokens = flattenTokenFragments([upstreamFragment, localFragment])
    const paths = tokens.map(token => token.path)

    expect(paths).toContain('colors.upstreamPublic')
    expect(paths).toContain('colors.localPublic')
    expect(paths).toContain('colors._private.localSecret')
    expect(paths).not.toContain('colors._private.upstreamSecret')
  })
})
