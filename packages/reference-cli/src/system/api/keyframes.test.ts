import { describe, expect, it, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { keyframes, createKeyframesCollector } from './keyframes'
import type { FragmentCollector } from '../../lib/fragments'
import { collectFragments } from '../../lib/fragments'

const fixtureDir = join(import.meta.dirname, '__fixtures__-keyframes')
const tempDir = join(import.meta.dirname, '__temp__-keyframes')

const keyframesCollector = createKeyframesCollector()

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
  rmSync(fixtureDir, { recursive: true, force: true })
})

describe('keyframes() with keyframes collector', () => {
  it('has correct collector config', () => {
    expect(keyframesCollector.config.name).toBe('keyframes')
    expect(keyframesCollector.config.targetFunction).toBe('keyframes')
  })

  it('collects raw keyframe definitions', () => {
    keyframesCollector.init()
    keyframes({
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
    })

    const result = keyframesCollector.getFragments()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
    })
    keyframesCollector.cleanup()
  })

  it('handles multiple keyframes calls', () => {
    keyframesCollector.init()
    keyframes({
      fadeIn: {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
    })
    keyframes({
      slideUp: {
        from: { transform: 'translateY(100%)' },
        to: { transform: 'translateY(0)' },
      },
    })

    const result = keyframesCollector.getFragments()
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('fadeIn')
    expect(result[1]).toHaveProperty('slideUp')
    keyframesCollector.cleanup()
  })
})

describe('keyframes() - E2E', () => {
  it('collects keyframes from user files', async () => {
    mkdirSync(fixtureDir, { recursive: true })

    writeFileSync(
      join(fixtureDir, 'my-keyframes.ts'),
      `
      import { keyframes } from '@reference-ui/cli/config'

      keyframes({
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      })
      `
    )

    const result = await collectFragments({
      files: [join(fixtureDir, 'my-keyframes.ts')],
      collector: keyframesCollector as FragmentCollector<unknown, unknown>,
      tempDir,
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
    })
  })

  it('collects from multiple files', async () => {
    mkdirSync(fixtureDir, { recursive: true })

    writeFileSync(
      join(fixtureDir, 'fade.ts'),
      `
      import { keyframes } from '@reference-ui/cli/config'

      keyframes({
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        }
      })
      `
    )

    writeFileSync(
      join(fixtureDir, 'slide.ts'),
      `
      import { keyframes } from '@reference-ui/cli/config'

      keyframes({
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' }
        }
      })
      `
    )

    const result = await collectFragments({
      files: [join(fixtureDir, 'fade.ts'), join(fixtureDir, 'slide.ts')],
      collector: keyframesCollector as FragmentCollector<unknown, unknown>,
      tempDir,
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('fadeIn')
    expect(result[1]).toHaveProperty('slideUp')
  })
})
