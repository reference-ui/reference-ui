// Unit tests for slotted recipe() resolution over registered per-slot tables.
// They take one slotted card config plus the tables sync emits for it and assert one class string per slot,
// per-slot raw styles, the slot projection and the shared variant metadata. Registration is module state,
// so the suite registers its tables up front.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { RecipeRuntimeTable } from '@reference-ui/rust/contracts'
import { recipe, registerRecipeData } from './recipe.ts'
import { projectSlot, slotClassName } from './slots.ts'

const CARD = {
  className: 'card',
  slots: ['root', 'title', 'body'],
  base: { root: { display: 'flex' }, title: { fontWeight: '600' } },
  variants: {
    size: {
      sm: { root: { padding: '3r' }, title: { fontSize: '4r' } },
      lg: { root: { padding: '6r' }, title: { fontSize: '5r' } },
    },
    tone: {
      quiet: { root: { bg: 'surface' } },
      loud: { root: { bg: 'brand' }, title: { color: 'white' } },
    },
  },
  defaultVariants: { size: 'sm', tone: 'quiet' },
  compoundVariants: [{ size: 'lg', tone: 'loud', css: { title: { letterSpacing: '0.02em' } } }],
} as const

// The per-slot tables sync emits for CARD: each slot ships only the cells that style it, plus every default.
const TABLES: Record<string, RecipeRuntimeTable> = {
  test__card__root: {
    variantMap: { size: ['sm', 'lg'], tone: ['quiet', 'loud'] },
    defaultVariants: { size: 0, tone: 0 },
    compoundVariants: [],
  },
  test__card__title: {
    variantMap: { size: ['sm', 'lg'], tone: ['loud'] },
    defaultVariants: { size: 0, tone: 'quiet' },
    compoundVariants: [{ predicates: { size: ['lg'], tone: ['loud'] } }],
  },
  test__card__body: {
    variantMap: {},
    defaultVariants: { size: 'sm', tone: 'quiet' },
    compoundVariants: [],
  },
}

beforeAll(() => {
  registerRecipeData('test', TABLES, ['md'])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('slotted recipe() resolution', () => {
  it('returns one class string per slot', () => {
    expect(recipe(CARD)({ size: 'lg', tone: 'loud' })).toEqual({
      root: 'test__card__root__base test__card__root_s_lg test__card__root_t_loud',
      title: 'test__card__title__base test__card__title_s_lg test__card__title_t_loud test__card__title_c_lg_loud',
      body: 'test__card__body__base',
    })
  })

  it('fills defaults per slot and keeps a key for a slot no variant styles', () => {
    expect(recipe(CARD)()).toEqual({
      root: 'test__card__root__base test__card__root_s_sm test__card__root_t_quiet',
      title: 'test__card__title__base test__card__title_s_sm',
      body: 'test__card__body__base',
    })
  })

  it('appends a responsive class only on slots with that cell', () => {
    expect(recipe(CARD)({ size: { base: 'sm', md: 'lg' } })).toEqual({
      root: 'test__card__root__base test__card__root_s_sm test__card__root_t_quiet md:test__card__root_s_lg',
      title: 'test__card__title__base test__card__title_s_sm md:test__card__title_s_lg',
      body: 'test__card__body__base',
    })
  })

  it('merges raw styles per slot, with an empty object for a slot with none', () => {
    expect(recipe(CARD).raw({ size: 'lg', tone: 'loud' })).toEqual({
      root: { display: 'flex', padding: '6r', bg: 'brand' },
      title: { fontWeight: '600', fontSize: '5r', color: 'white', letterSpacing: '0.02em' },
      body: {},
    })
    expect(recipe(CARD).raw()).toEqual({
      root: { display: 'flex', padding: '3r', bg: 'surface' },
      title: { fontWeight: '600', fontSize: '4r' },
      body: {},
    })
  })

  it('reports every authored axis and splits props like a plain recipe', () => {
    const card = recipe(CARD)
    expect(card.variantKeys).toEqual(['size', 'tone'])
    expect(card.variantMap).toEqual({ size: ['sm', 'lg'], tone: ['quiet', 'loud'] })
    expect(card.splitVariantProps({ size: 'lg', id: 'x' })).toEqual([{ size: 'lg' }, { id: 'x' }])
  })

  it('resolves a slot with no compiled table to nothing and warns once per key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ghost = recipe({ className: 'ghost', slots: ['root'] })
    expect(ghost()).toEqual({ root: '' })
    expect(ghost()).toEqual({ root: '' })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toContain('test__ghost__root')
  })
})

describe('slot projection', () => {
  it('names each slot className__slot', () => {
    expect(slotClassName('card', 'root')).toBe('card__root')
  })

  it('keeps only the cells, axes and compounds that name the slot, and every default', () => {
    expect(projectSlot(CARD, 'title')).toEqual({
      className: 'card__title',
      base: { fontWeight: '600' },
      variants: { size: { sm: { fontSize: '4r' }, lg: { fontSize: '5r' } }, tone: { loud: { color: 'white' } } },
      defaultVariants: { size: 'sm', tone: 'quiet' },
      compoundVariants: [{ size: 'lg', tone: 'loud', css: { letterSpacing: '0.02em' } }],
    })
    expect(projectSlot(CARD, 'body')).toEqual({
      className: 'card__body',
      variants: {},
      defaultVariants: { size: 'sm', tone: 'quiet' },
      compoundVariants: [],
    })
  })

  it('skips a variant option with no styles for the slot instead of throwing', () => {
    const config = { className: 'x', slots: ['root'], variants: { s: { a: undefined as never } } }
    expect(projectSlot(config, 'root')).toEqual({ className: 'x__root', variants: {} })
  })

  it('skips a compound with no css instead of throwing', () => {
    const config = { className: 'x', slots: ['root'], compoundVariants: [{ s: 'a' } as never] }
    expect(projectSlot(config, 'root')).toEqual({ className: 'x__root', compoundVariants: [] })
  })

  it('reads only own keys, so a slot named constructor takes no prototype entry', () => {
    const config = {
      className: 'x',
      slots: ['constructor'],
      base: {},
      variants: { s: { a: { root: { color: 'red' } }, b: { constructor: { color: 'blue' } } } },
    }
    const projected = projectSlot(config, 'constructor')
    expect(projected).not.toHaveProperty('base')
    expect(projected).toEqual({ className: 'x__constructor', variants: { s: { b: { color: 'blue' } } } })
  })

  it('constructs a recipe from a config with a styleless option and a css-less compound', () => {
    const config = {
      className: 'x',
      slots: ['root'],
      variants: { s: { a: undefined as never } },
      compoundVariants: [{ s: 'a' } as never],
    }
    expect(() => recipe(config)).not.toThrow()
  })
})
