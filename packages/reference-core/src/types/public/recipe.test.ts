import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { RecipeDefinition } from './recipe'

const recipeSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'recipe.ts'),
  'utf-8'
)

describe('TYP-RECIPE-03 owned recipe contracts', () => {
  it('TYP-RECIPE-03 declares recipe types without importing @reference-ui/styled', () => {
    expect(recipeSource).not.toContain('@reference-ui/styled')
    expect(recipeSource).toContain('export interface RecipeCreatorFn')
    expect(recipeSource).toContain('export interface RecipeDefinition')
    expect(recipeSource).toContain('export interface RecipeRuntimeFn')
    expect(recipeSource).toContain('export type RecipeSelection')
    expect(recipeSource).toContain('export type RecipeVariantProps')
  })

  it('TYP-RECIPE-03 RecipeDefinition exposes the fields customCvaFn reads', () => {
    const definition: RecipeDefinition = {
      base: { display: 'grid' },
      variants: {
        tone: {
          accent: { color: 'blue.600' },
        },
      },
      compoundVariants: [
        {
          css: { color: 'red.500' },
        },
      ],
    }

    expect(definition.base).toEqual({ display: 'grid' })
    expect(definition.variants).toEqual({
      tone: {
        accent: { color: 'blue.600' },
      },
    })
    expect(definition.compoundVariants?.[0]?.css).toEqual({ color: 'red.500' })
  })
})
