import { afterEach, describe, expect, it } from 'vitest'
import { extendThemes } from './extendThemes'
import { getPandaConfig, initPandaConfig, PANDA_CONFIG_GLOBAL_KEY } from './runtime'

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[PANDA_CONFIG_GLOBAL_KEY]
})

describe('extendThemes()', () => {
  it('merges Panda theme variants and enables static CSS generation for them', () => {
    initPandaConfig({
      themes: {
        light: {
          tokens: {
            colors: {
              text: {
                value: '{colors.gray.950}',
              },
            },
          },
        },
      },
      staticCss: {
        themes: ['light'],
      },
    })

    extendThemes({
      dark: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.50}',
            },
          },
        },
      },
    })

    const config = getPandaConfig()

    expect(config.themes).toEqual({
      light: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.950}',
            },
          },
        },
      },
      dark: {
        tokens: {
          colors: {
            text: {
              value: '{colors.gray.50}',
            },
          },
        },
      },
    })

    expect(config.staticCss).toEqual({
      themes: ['light', 'dark'],
    })
  })
})
