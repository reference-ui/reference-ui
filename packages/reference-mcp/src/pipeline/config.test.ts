// Vitest tests for the MCP Atlas config builder.
// They take project configs and assert the selector: includes, excludes, and the primitives
// observe entry, with empty lists dropped.
import { describe, expect, it } from 'vitest'
import { getAtlasMcpConfig } from './config'
import { REFERENCE_UI_PRIMITIVE_NAMES } from './primitives'

const PRIMITIVE_OBSERVE = [
  { source: '@reference-ui/react', names: REFERENCE_UI_PRIMITIVE_NAMES },
]

describe('getAtlasMcpConfig', () => {
  it('always observes Reference UI primitives when no mcp selectors exist', () => {
    expect(getAtlasMcpConfig(undefined)).toEqual({
      rootDir: '',
      observe: PRIMITIVE_OBSERVE,
    })
    expect(
      getAtlasMcpConfig({
        name: 'test',
        include: ['src/**/*.{ts,tsx}'],
      })
    ).toEqual({
      rootDir: '',
      observe: PRIMITIVE_OBSERVE,
    })
  })

  it('maps dedicated mcp include/exclude directly to Atlas config', () => {
    expect(
      getAtlasMcpConfig({
        name: 'test',
        include: ['src/**/*.{ts,tsx}'],
        mcp: {
          include: ['src/components/**'],
          exclude: ['src/components/internal/**'],
        },
      })
    ).toEqual({
      rootDir: '',
      include: ['src/components/**'],
      exclude: ['src/components/internal/**'],
      observe: PRIMITIVE_OBSERVE,
    })
  })
})
