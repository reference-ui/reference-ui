import { afterEach, describe, expect, it } from 'vitest'
import { extendFontFaces } from './extendFontFaces'
import { getPandaConfig, initPandaConfig, PANDA_CONFIG_GLOBAL_KEY } from './runtime'

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[PANDA_CONFIG_GLOBAL_KEY]
})

describe('extendFontFaces()', () => {
  it('merges global font-face config into the Panda config store', () => {
    initPandaConfig({
      globalFontface: {
        Inter: {
          src: 'url(/fonts/inter.woff2) format("woff2")',
        },
      },
    })

    extendFontFaces({
      'Playfair Display': {
        src: 'url(/fonts/playfair.woff2) format("woff2")',
        fontDisplay: 'swap',
      },
    })

    const config = getPandaConfig()

    expect(config.globalFontface).toEqual({
      Inter: {
        src: 'url(/fonts/inter.woff2) format("woff2")',
      },
      'Playfair Display': {
        src: 'url(/fonts/playfair.woff2) format("woff2")',
        fontDisplay: 'swap',
      },
    })
  })
})
