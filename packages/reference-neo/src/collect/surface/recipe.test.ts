// Unit tests for the Neo recipe() collector.
// They take recipe configs and assert collected fragments.
// This file mirrors the collector unit shape of the tokens tests.

import { describe, expect, it } from 'vitest'
import { recipe, createRecipeCollector } from './recipe.ts'

const recipeCollector = createRecipeCollector()

describe('recipe() with recipe collector', () => {
  it('has correct collector config', () => {
    expect(recipeCollector.config.name).toBe('recipe')
    expect(recipeCollector.config.targetFunction).toBe('recipe')
  })

  it('collects raw recipe definitions', () => {
    recipeCollector.init()
    recipe({
      className: 'tone',
      base: { display: 'inline-flex' },
      variants: {
        tone: {
          accent: { color: 'brand' },
          muted: { color: 'paper' },
        },
      },
      defaultVariants: { tone: 'muted' },
    })

    const result = recipeCollector.getFragments()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      className: 'tone',
      base: { display: 'inline-flex' },
      variants: {
        tone: {
          accent: { color: 'brand' },
          muted: { color: 'paper' },
        },
      },
      defaultVariants: { tone: 'muted' },
    })
    recipeCollector.cleanup()
  })

  it('handles multiple recipe calls', () => {
    recipeCollector.init()
    recipe({
      className: 'tone',
      variants: {
        tone: { accent: { color: 'brand' } },
      },
    })
    recipe({
      className: 'size',
      variants: {
        size: { sm: { p: 'sm' } },
      },
    })

    const result = recipeCollector.getFragments()
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('className', 'tone')
    expect(result[1]).toHaveProperty('className', 'size')
    recipeCollector.cleanup()
  })
})
