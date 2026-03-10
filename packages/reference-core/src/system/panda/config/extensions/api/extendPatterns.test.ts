import { afterEach, describe, expect, it } from 'vitest'
import { extendPatterns } from './extendPatterns'
import { getPandaConfig, initPandaConfig, PANDA_CONFIG_GLOBAL_KEY } from './runtime'
import type { BoxPatternExtension } from '../../../../api/patterns'
import { PRIMITIVE_JSX_NAMES } from '../../../../primitives/tags'

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[PANDA_CONFIG_GLOBAL_KEY]
})

describe('extendPatterns()', () => {
  it('combines box pattern extensions into one self-contained box config', () => {
    initPandaConfig({})

    const extensions: BoxPatternExtension[] = [
      {
        properties: {
          container: { type: 'string' },
        },
        transform(props: Record<string, unknown>) {
          const { container } = props
          if (container === undefined) return {}

          return {
            containerType: 'inline-size',
            ...(typeof container === 'string' && container && { containerName: container }),
          }
        },
      },
      {
        properties: {
          r: { type: 'object' },
        },
        transform(props: Record<string, unknown>) {
          const { r, container } = props
          if (!r || typeof r !== 'object') return {}

          const containerName =
            typeof container === 'string' && container.length > 0 ? container : undefined
          const prefix = containerName
            ? `@container ${containerName} (min-width:`
            : '@container (min-width:'

          return Object.fromEntries(
            Object.entries(r as Record<string, unknown>).map(([bp, styles]) => [
              `${prefix} ${bp}px)`,
              styles,
            ])
          )
        },
      },
    ]

    extendPatterns(extensions)

    const config = getPandaConfig()
    const boxPattern = config.patterns?.extend?.box

    expect(boxPattern).toBeDefined()
    expect(boxPattern?.jsx).toEqual(PRIMITIVE_JSX_NAMES)
    expect(boxPattern?.properties).toEqual({
      container: { type: 'string' },
      r: { type: 'object' },
    })
    expect(boxPattern?.blocklist).toEqual(['container', 'r'])

    const transform = boxPattern?.transform as ((props: Record<string, unknown>) => Record<string, unknown>) | undefined
    expect(transform).toBeTypeOf('function')
    expect(
      transform?.({
        container: 'sidebar',
        r: {
          640: { padding: '4' },
        },
        color: 'red.500',
      })
    ).toEqual({
      containerType: 'inline-size',
      containerName: 'sidebar',
      '@container sidebar (min-width: 640px)': { padding: '4' },
      color: 'red.500',
    })
    expect(
      transform?.({
        container: true,
        r: {
          480: { padding: '2' },
        },
      })
    ).toEqual({
      containerType: 'inline-size',
      '@container (min-width: 480px)': { padding: '2' },
    })
  })
})
