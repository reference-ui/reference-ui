import { afterEach, describe, expect, it } from 'vitest'
import { extendGlobalCss } from './extendGlobalCss'
import { getPandaConfig, initPandaConfig, PANDA_CONFIG_GLOBAL_KEY } from './runtime'

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[PANDA_CONFIG_GLOBAL_KEY]
})

describe('extendGlobalCss()', () => {
  it('merges collected global css fragments into the Panda config store', () => {
    initPandaConfig({})

    extendGlobalCss([
      {
        ':root': {
          '--ref-app-test-var': '42px',
        },
      },
      {
        body: {
          margin: '0',
        },
      },
    ])

    const config = getPandaConfig()

    expect(config.globalCss).toEqual({
      ':root': {
        '--ref-app-test-var': '42px',
      },
      body: {
        margin: '0',
      },
    })
  })
})
