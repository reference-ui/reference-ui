import { afterEach, describe, expect, it } from 'vitest'
import { extendRecipes } from './extendRecipes'
import { getPandaConfig, initPandaConfig, PANDA_CONFIG_GLOBAL_KEY } from './runtime'

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[PANDA_CONFIG_GLOBAL_KEY]
})

describe('extendRecipes()', () => {
  it('merges theme recipes into the Panda config store', () => {
    initPandaConfig({
      theme: {
        recipes: {
          button: {
            className: 'r_button',
          },
        },
      },
    })

    extendRecipes({
      fontStyle: {
        className: 'r_font',
      },
    })

    const config = getPandaConfig()

    expect(config.theme).toEqual({
      recipes: {
        button: {
          className: 'r_button',
        },
        fontStyle: {
          className: 'r_font',
        },
      },
    })
  })
})
