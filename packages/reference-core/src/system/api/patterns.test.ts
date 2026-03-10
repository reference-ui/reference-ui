import { describe, expect, it, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { extendPattern, createBoxPatternCollector } from './patterns'
import type { FragmentCollector } from '../../lib/fragments'
import { collectFragments } from '../../lib/fragments'

const fixtureDir = join(import.meta.dirname, '__fixtures__-patterns')
const tempDir = join(import.meta.dirname, '__temp__-patterns')

const patternCollector = createBoxPatternCollector()

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
  rmSync(fixtureDir, { recursive: true, force: true })
})

describe('extendPattern() with pattern collector', () => {
  it('has correct collector config', () => {
    expect(patternCollector.config.name).toBe('box-pattern')
    expect(patternCollector.config.targetFunction).toBe('extendPattern')
  })

  it('collects raw box pattern extensions', () => {
    patternCollector.init()
    extendPattern({
      properties: {
        container: { type: 'string' },
      },
      transform(props: Record<string, unknown>) {
        const { container } = props
        return container ? { containerName: container } : {}
      },
    })

    const result = patternCollector.getFragments()
    expect(result).toHaveLength(1)
    expect(result[0]?.properties).toEqual({
      container: { type: 'string' },
    })
    expect(result[0]?.transform({ container: 'sidebar' })).toEqual({
      containerName: 'sidebar',
    })
    patternCollector.cleanup()
  })
})

describe('extendPattern() - E2E', () => {
  it('collects pattern extensions from user files', async () => {
    mkdirSync(fixtureDir, { recursive: true })

    writeFileSync(
      join(fixtureDir, 'my-pattern.ts'),
      `
      import { extendPattern } from '@reference-ui/core/config'

      extendPattern({
        properties: {
          highlight: { type: 'boolean' }
        },
        transform(props) {
          return props.highlight ? { outline: '2px solid red' } : {}
        }
      })
      `
    )

    const result = await collectFragments({
      files: [join(fixtureDir, 'my-pattern.ts')],
      collector: patternCollector as FragmentCollector<unknown, unknown>,
      tempDir,
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('properties.highlight')
    expect((result[0] as { transform: (props: Record<string, unknown>) => Record<string, unknown> }).transform({
      highlight: true,
    })).toEqual({ outline: '2px solid red' })
  })
})
