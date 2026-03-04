import { describe, expect, it, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tokensCollector } from './tokens'
import { collectFragments } from '../../lib/fragments'

const fixtureDir = join(import.meta.dirname, '__fixtures__')
const tempDir = join(import.meta.dirname, '__temp__')

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
  rmSync(fixtureDir, { recursive: true, force: true })
})

describe('tokensCollector', () => {
  it('has correct config', () => {
    expect(tokensCollector.config.name).toBe('tokens')
    expect(tokensCollector.config.targetFunction).toBe('tokens')
  })

  it('transforms token definitions into panda config shape', () => {
    tokensCollector.init()
    tokensCollector({
      colors: {
        brand: {
          primary: { value: '#0066cc' },
        },
      },
    })

    const result = tokensCollector.getFragments()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      theme: {
        tokens: {
          colors: {
            brand: {
              primary: { value: '#0066cc' },
            },
          },
        },
      },
    })
    tokensCollector.cleanup()
  })

  it('handles multiple token calls', () => {
    tokensCollector.init()
    tokensCollector({
      colors: {
        brand: { value: '#0066cc' },
      },
    })
    tokensCollector({
      spacing: {
        sm: { value: '0.5rem' },
      },
    })

    const result = tokensCollector.getFragments()
    expect(result).toHaveLength(2)
    expect(result[0].theme.tokens).toHaveProperty('colors')
    expect(result[1].theme.tokens).toHaveProperty('spacing')
    tokensCollector.cleanup()
  })
})

describe('tokens() - E2E', () => {
  it('collects tokens from user files', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    
    // User file calling tokens()
    writeFileSync(
      join(fixtureDir, 'my-tokens.ts'),
      `
      import { tokens } from '@reference-ui/cli/config'
      
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
      collector: tokensCollector,
      tempDir,
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      theme: {
        tokens: {
          colors: {
            brand: {
              primary: { value: '#0066cc' },
              secondary: { value: '#ff6600' },
            },
          },
        },
      },
    })
  })

  it('collects from multiple files', async () => {
    mkdirSync(fixtureDir, { recursive: true })
    
    writeFileSync(
      join(fixtureDir, 'colors.ts'),
      `
      import { tokens } from '@reference-ui/cli/config'
      
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
      import { tokens } from '@reference-ui/cli/config'
      
      tokens({
        spacing: {
          sm: { value: '0.5rem' }
        }
      })
      `
    )

    const result = await collectFragments({
      files: [join(fixtureDir, 'colors.ts'), join(fixtureDir, 'spacing.ts')],
      collector: tokensCollector,
      tempDir,
    })

    expect(result).toHaveLength(2)
    expect(result[0].theme.tokens).toHaveProperty('colors')
    expect(result[1].theme.tokens).toHaveProperty('spacing')
  })
})
