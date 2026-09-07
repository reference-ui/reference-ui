import { describe, expect, it } from 'vitest'
import { getAtlasMcpConfig } from './config'

describe('getAtlasMcpConfig', () => {
  it('returns undefined when no mcp config exists', () => {
    expect(getAtlasMcpConfig(undefined)).toBeUndefined()
    expect(
      getAtlasMcpConfig({
        name: 'test',
        include: ['src/**/*.{ts,tsx}'],
      })
    ).toBeUndefined()
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
    })
  })
})
