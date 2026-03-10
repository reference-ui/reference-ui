import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { collectFragments, type FragmentCollector } from '../../lib/fragments'
import { createFontCollector, font } from './font'

const fixtureDir = join(import.meta.dirname, '__fixtures__-font')
const tempDir = join(import.meta.dirname, '__temp__-font')

const fontCollector = createFontCollector()

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
  rmSync(fixtureDir, { recursive: true, force: true })
})

describe('font() with font collector', () => {
  it('has correct collector config', () => {
    expect(fontCollector.config.name).toBe('font')
    expect(fontCollector.config.targetFunction).toBe('font')
  })

  it('collects raw font definitions', () => {
    fontCollector.init()
    font('display', {
      value: '"Playfair Display", serif',
      fontFace: {
        src: 'url(/fonts/playfair.woff2) format("woff2")',
        fontWeight: '400 900',
      },
      weights: {
        normal: '400',
        bold: '700',
      },
      css: {
        letterSpacing: '-0.02em',
      },
    })

    const result = fontCollector.getFragments()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'display',
      value: '"Playfair Display", serif',
      fontFace: {
        src: 'url(/fonts/playfair.woff2) format("woff2")',
        fontWeight: '400 900',
      },
      weights: {
        normal: '400',
        bold: '700',
      },
      css: {
        letterSpacing: '-0.02em',
      },
    })
    fontCollector.cleanup()
  })
})

describe('extendFont() - E2E', () => {
  it('collects font definitions from user files through the compatibility alias', async () => {
    mkdirSync(fixtureDir, { recursive: true })

    writeFileSync(
      join(fixtureDir, 'my-fonts.ts'),
      `
      import { extendFont } from '../../../config/index.ts'

      extendFont('sans', {
        value: '"Inter", ui-sans-serif, sans-serif',
        fontFace: {
          src: 'url(/fonts/inter.woff2) format("woff2")',
          fontWeight: '200 900',
          fontDisplay: 'swap'
        },
        weights: {
          normal: '400',
          bold: '700'
        },
        css: {
          letterSpacing: '-0.01em'
        }
      })
      `
    )

    const result = await collectFragments({
      files: [join(fixtureDir, 'my-fonts.ts')],
      collector: fontCollector as FragmentCollector<unknown, unknown>,
      tempDir,
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'sans',
      value: '"Inter", ui-sans-serif, sans-serif',
      fontFace: {
        src: 'url(/fonts/inter.woff2) format("woff2")',
        fontWeight: '200 900',
        fontDisplay: 'swap',
      },
      weights: {
        normal: '400',
        bold: '700',
      },
      css: {
        letterSpacing: '-0.01em',
      },
    })
  })
})
