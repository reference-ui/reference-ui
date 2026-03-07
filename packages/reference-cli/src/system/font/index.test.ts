import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { getFontFragmentsForConfig } from './index'

const fixtureDir = join(import.meta.dirname, '__fixtures__')
const tempDir = join(import.meta.dirname, '__temp__')

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
  rmSync(fixtureDir, { recursive: true, force: true })
})

describe('getFontFragmentsForConfig()', () => {
  it('renders config and pattern outputs from font() definitions', async () => {
    mkdirSync(fixtureDir, { recursive: true })

    writeFileSync(
      join(fixtureDir, 'fonts.ts'),
      `
      import { font } from '@reference-ui/cli/config'

      font('display', {
        value: '"Playfair Display", serif',
        fontFace: {
          src: 'url(/fonts/playfair.woff2) format("woff2")',
          fontWeight: '400 900',
          fontDisplay: 'swap',
        },
        weights: {
          normal: '400',
          bold: '700',
        },
        css: {
          letterSpacing: '-0.02em',
        },
      })
      `,
    )

    const result = await getFontFragmentsForConfig({
      cwd: fixtureDir,
      userInclude: ['**/*.ts'],
      tempDir,
    })

    expect(result.definitionsCount).toBe(1)
    expect(result.fontConfigFragments).toContain('tokens({')
    expect(result.fontConfigFragments).toContain('globalFontface({')
    expect(result.fontConfigFragments).toContain("recipe('fontStyle'")
    expect(result.fontConfigFragments).toContain('display')
    expect(result.fontConfigFragments).toContain("'display.bold'")

    expect(result.fontPatternFile).toBeDefined()
    const patternContent = readFileSync(result.fontPatternFile!, 'utf-8')
    // Portable microbundle IIFE — contains inlined pattern (esbuild may use double quotes)
    expect(patternContent.length).toBeGreaterThan(100)
    expect(patternContent).toMatch(/font:\s*\{\s*type:\s*["']string["']\s*\}/)
    expect(patternContent).toMatch(/weight:\s*\{\s*type:\s*["']string["']\s*\}/)
    expect(patternContent).toContain('display.bold')
    expect(patternContent).toContain('700')
  })
})
