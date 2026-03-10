import { describe, expect, it } from 'vitest'
import { buildFontTypeRegistry, renderGeneratedFontRegistryFile } from './generate'
import type { FontDefinition } from '../api/font'

describe('system font types generation', () => {
  it('builds a merged registry from collected font definitions', () => {
    const fonts: FontDefinition[] = [
      {
        name: 'sans',
        value: '"Inter", sans-serif',
        fontFace: { src: 'url(/fonts/inter.woff2)' },
        weights: {
          normal: '400',
        },
      },
      {
        name: 'sans',
        value: '"Inter", sans-serif',
        fontFace: { src: 'url(/fonts/inter.woff2)' },
        weights: {
          bold: '700',
        },
      },
      {
        name: 'mono',
        value: '"JetBrains Mono", monospace',
        fontFace: { src: 'url(/fonts/jetbrains-mono.woff2)' },
        weights: {
          light: '300',
        },
      },
    ]

    expect(buildFontTypeRegistry(fonts)).toEqual({
      sans: ['normal', 'bold'],
      mono: ['light'],
    })
  })

  it('renders a module augmentation for the generated font registry', () => {
    expect(
      renderGeneratedFontRegistryFile({
        sans: ['normal', 'bold'],
      })
    ).toContain(`"sans": {
        "normal": true
        "bold": true`)
  })
})
