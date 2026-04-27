import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RecipeDefinition } from '../../../types'

const { styledCvaMock } = vi.hoisted(() => ({
  styledCvaMock: vi.fn(),
}))

vi.mock('@reference-ui/styled/css/cva', () => ({
  cva: styledCvaMock,
}))

import { customCvaFn } from './customCvaFn'

describe('system/runtime/recipe customCvaFn', () => {
  afterEach(() => {
    styledCvaMock.mockReset()
  })

  it('lowers responsive recipe styles before delegating to Panda cva()', () => {
    const runtimeRecipe = { __cva__: true }
    styledCvaMock.mockReturnValue(runtimeRecipe)

    const config = {
      base: {
        display: 'grid',
        r: {
          320: { gap: '2r' },
        },
      },
      variants: {
        tone: {
          accent: {
            r: {
              640: { color: 'blue.600' },
            },
          },
        },
      },
      compoundVariants: [
        {
          tone: 'accent',
          css: {
            _hover: {
              r: {
                960: { color: 'red.500' },
              },
            },
          },
        },
      ],
      defaultVariants: {
        tone: 'accent',
      },
    } as unknown as RecipeDefinition

    const recipe = customCvaFn(config)

    expect(recipe).toBe(runtimeRecipe)
    expect(styledCvaMock).toHaveBeenCalledTimes(1)
    expect(styledCvaMock).toHaveBeenCalledWith({
      base: {
        display: 'grid',
        '@container (min-width: 320px)': {
          gap: '2r',
        },
      },
      variants: {
        tone: {
          accent: {
            '@container (min-width: 640px)': {
              color: 'blue.600',
            },
          },
        },
      },
      compoundVariants: [
        {
          tone: 'accent',
          css: {
            _hover: {
              '@container (min-width: 960px)': {
                color: 'red.500',
              },
            },
          },
        },
      ],
      defaultVariants: {
        tone: 'accent',
      },
    })

    expect(config).toEqual({
      base: {
        display: 'grid',
        r: {
          320: { gap: '2r' },
        },
      },
      variants: {
        tone: {
          accent: {
            r: {
              640: { color: 'blue.600' },
            },
          },
        },
      },
      compoundVariants: [
        {
          tone: 'accent',
          css: {
            _hover: {
              r: {
                960: { color: 'red.500' },
              },
            },
          },
        },
      ],
      defaultVariants: {
        tone: 'accent',
      },
    })
  })

  it('leaves unsupported recipe responsive shapes untouched across recipe sections', () => {
    styledCvaMock.mockReturnValue({ __cva__: true })

    const invalidBase = {
      r: {
        sidebar: { padding: '2r' },
      },
    }

    const invalidVariant = {
      _hover: {
        r: {
          content: { color: 'blue.600' },
        },
      },
    }

    const invalidCompound = {
      r: {
        wide: { backgroundColor: 'red.500' },
      },
    }

    customCvaFn({
      base: invalidBase,
      variants: {
        tone: {
          accent: invalidVariant,
        },
      },
      compoundVariants: [
        {
          tone: 'accent',
          css: invalidCompound,
        },
      ],
    } as unknown as RecipeDefinition)

    expect(styledCvaMock).toHaveBeenCalledWith({
      base: invalidBase,
      variants: {
        tone: {
          accent: invalidVariant,
        },
      },
      compoundVariants: [
        {
          tone: 'accent',
          css: invalidCompound,
        },
      ],
    })
  })

  it('passes through non-responsive recipe config unchanged apart from wrapper delegation', () => {
    styledCvaMock.mockReturnValue({ __cva__: true })

    const config = {
      base: {
        padding: '4r',
        color: 'white',
      },
      variants: {
        tone: {
          accent: {
            backgroundColor: 'blue.600',
          },
        },
      },
      compoundVariants: [
        {
          tone: 'accent',
          css: {
            _hover: {
              color: 'black',
            },
          },
        },
      ],
      defaultVariants: {
        tone: 'accent',
      },
    } as unknown as RecipeDefinition

    customCvaFn(config)

    expect(styledCvaMock).toHaveBeenCalledWith(config)
  })

  it('omits undefined optional recipe fields so Panda defaults still apply', () => {
    styledCvaMock.mockReturnValue({ __cva__: true })

    customCvaFn({
      defaultVariants: {
        tone: 'accent',
      },
    } as unknown as RecipeDefinition)

    expect(styledCvaMock).toHaveBeenCalledWith({
      defaultVariants: {
        tone: 'accent',
      },
    })
  })
})