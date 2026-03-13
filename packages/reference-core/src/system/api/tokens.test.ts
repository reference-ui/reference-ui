import { describe, expect, it, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tokens, createTokensCollector } from './tokens'
import type { FragmentCollector } from '../../lib/fragments'
import { collectFragments } from '../../lib/fragments'

const fixtureDir = join(import.meta.dirname, '__fixtures__-tokens')
const tempDir = join(import.meta.dirname, '__temp__-tokens')

const tokensCollector = createTokensCollector()

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
  rmSync(fixtureDir, { recursive: true, force: true })
})

describe('tokens() with tokens collector', () => {
  it('has correct collector config', () => {
    expect(tokensCollector.config.name).toBe('tokens')
    expect(tokensCollector.config.targetFunction).toBe('tokens')
  })

  it('collects raw token definitions', () => {
    tokensCollector.init()
    tokens({
      colors: {
        brand: {
          primary: { value: '#0066cc' },
        },
      },
    })

    const result = tokensCollector.getFragments()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      colors: {
        brand: {
          primary: { value: '#0066cc' },
        },
      },
    })
    tokensCollector.cleanup()
  })

  it('handles multiple token calls', () => {
    tokensCollector.init()
    tokens({
      colors: {
        brand: { value: '#0066cc' },
      },
    })
    tokens({
      spacing: {
        sm: { value: '0.5rem' },
      },
    })

    const result = tokensCollector.getFragments()
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('colors')
    expect(result[1]).toHaveProperty('spacing')
    tokensCollector.cleanup()
  })
})

describe('tokens() - E2E', () => {
  it('collects tokens from user files', async () => {
    mkdirSync(fixtureDir, { recursive: true })

    writeFileSync(
      join(fixtureDir, 'my-tokens.ts'),
      `
      import { tokens } from '../tokens'

      tokens({
        colors: {
          brand: {
            primary: { value: '#0066cc' },
            secondary: { value: '#ff6600' }
          }
        }
      })
      `
    )

    const result = await collectFragments({
      files: [join(fixtureDir, 'my-tokens.ts')],
      collector: tokensCollector as FragmentCollector<unknown, unknown>,
      tempDir,
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      colors: {
        brand: {
          primary: { value: '#0066cc' },
          secondary: { value: '#ff6600' },
        },
      },
    })
  })

  it('collects from multiple files', async () => {
    mkdirSync(fixtureDir, { recursive: true })

    writeFileSync(
      join(fixtureDir, 'colors.ts'),
      `
      import { tokens } from '../tokens'

      tokens({
        colors: {
          red: { value: '#ff0000' }
        }
      })
      `
    )

    writeFileSync(
      join(fixtureDir, 'spacing.ts'),
      `
      import { tokens } from '../tokens'

      tokens({
        spacing: {
          sm: { value: '0.5rem' }
        }
      })
      `
    )

    const result = await collectFragments({
      files: [join(fixtureDir, 'colors.ts'), join(fixtureDir, 'spacing.ts')],
      collector: tokensCollector as FragmentCollector<unknown, unknown>,
      tempDir,
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('colors')
    expect(result[1]).toHaveProperty('spacing')
  })
})
