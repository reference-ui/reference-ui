// Unit tests for the Neo recipe() runtime over registered tables.
// They take authored configs plus selections and assert resolved classes.
// Registration is module state, so the suite registers once up front.

import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { RecipeRuntimeTable } from '@reference-ui/rust/contracts'
import { recipe, registerRecipeData, type RecipeConfig } from './recipe.ts'

const STEM = 'test__button'

// New-contract table: derivation inputs only, no pre-composed maps.
const TABLE: RecipeRuntimeTable = {
  variantMap: {
    tone: ['accent', 'muted'],
    size: ['sm', 'lg'],
  },
  defaultVariants: { tone: 1, size: 0 },
  compoundVariants: [{ predicates: { tone: ['accent'], size: ['lg'] } }],
  responsiveBreakpoints: ['md', 'lg'],
}

const MUTED_SM = `${STEM}__base ${STEM}_t_muted ${STEM}_s_sm`
const ACCENT_SM = `${STEM}__base ${STEM}_t_accent ${STEM}_s_sm`
const ACCENT_LG = `${STEM}__base ${STEM}_t_accent ${STEM}_s_lg ${STEM}_c_accent_lg`

const CONFIG: RecipeConfig = {
  className: 'button',
  base: { display: 'inline-flex' },
  variants: {
    tone: { accent: { color: 'brand' }, muted: { color: 'paper' } },
    size: { sm: { p: 'sm' }, lg: { p: 'lg' } },
  },
  defaultVariants: { tone: 'muted', size: 'sm' },
  compoundVariants: [{ tone: 'accent', size: 'lg', css: { backgroundColor: 'ink' } }],
}

beforeAll(() => {
  registerRecipeData('test', { [STEM]: TABLE })
})

describe('recipe() resolution', () => {
  it('composes base plus variants for full selections', () => {
    const button = recipe(CONFIG)
    expect(button({ tone: 'accent', size: 'lg' })).toBe(ACCENT_LG)
    expect(button({ tone: 'muted', size: 'sm' })).toBe(MUTED_SM)
  })

  it('fills gaps from default variants', () => {
    const button = recipe(CONFIG)
    expect(button()).toBe(MUTED_SM)
    expect(button({ tone: 'accent' })).toBe(ACCENT_SM)
    expect(button({ tone: undefined, size: null })).toBe(MUTED_SM)
  })

  it('fires compounds only when every predicate holds', () => {
    const button = recipe(CONFIG)
    expect(button({ tone: 'accent', size: 'lg' })).toContain(`${STEM}_c_accent_lg`)
    expect(button({ tone: 'accent', size: 'sm' })).not.toContain(`${STEM}_c_accent_lg`)
    expect(button({ tone: 'muted', size: 'lg' })).not.toContain(`${STEM}_c_accent_lg`)
  })

  it('stringifies boolean selections for true/false options', () => {
    const stem = 'test__toggle'
    registerRecipeData('test', {
      [stem]: {
        variantMap: { disabled: ['true', 'false'] },
        defaultVariants: { disabled: 1 },
        compoundVariants: [],
      },
    })
    const toggle = recipe({ className: 'toggle' })
    expect(toggle({ disabled: true })).toBe(`${stem}__base ${stem}_d_true`)
    expect(toggle({ disabled: false })).toBe(`${stem}__base ${stem}_d_false`)
    expect(toggle()).toBe(`${stem}__base ${stem}_d_false`)
    registerRecipeData('test', { [STEM]: TABLE })
  })

  it('resolves unknown recipes to nothing', () => {
    const ghost = recipe({ className: 'ghost' })
    expect(ghost({ tone: 'accent' })).toBe('')
  })

  it('reproduces first-char axis-prefix collisions exactly', () => {
    const stem = 'test__collide'
    registerRecipeData('test', {
      [stem]: {
        variantMap: { tone: ['muted'], tint: ['red'] },
        defaultVariants: {},
        compoundVariants: [],
      },
    })
    const collide = recipe({ className: 'collide' })
    expect(collide({ tone: 'muted', tint: 'red' })).toBe(
      'test__collide__base test__collide_t_muted test__collide_t_red'
    )
    registerRecipeData('test', { [STEM]: TABLE })
  })

  it('prefers a legacy shipped combinations map on hit', () => {
    registerRecipeData('test', {
      [STEM]: { ...TABLE, combinations: { 'accent|lg': 'LEGACY_COMBO' } },
    })
    const button = recipe(CONFIG)
    expect(button({ tone: 'accent', size: 'lg' })).toBe('LEGACY_COMBO')
    expect(button({ tone: 'muted', size: 'sm' })).toBe(MUTED_SM)
    registerRecipeData('test', { [STEM]: TABLE })
  })
})

describe('recipe() derivation inputs', () => {
  it('matches multi-value predicates and derives the joined class', () => {
    const stem = 'test__sizes'
    registerRecipeData('test', {
      [stem]: {
        variantMap: { size: ['sm', 'md', 'lg'] },
        defaultVariants: { size: 2 },
        compoundVariants: [{ predicates: { size: ['sm', 'md'] } }],
      },
    })
    const sizes = recipe({ className: 'sizes' })
    expect(sizes({ size: 'sm' })).toBe(`${stem}__base ${stem}_s_sm ${stem}_c_sm_md`)
    expect(sizes({ size: 'md' })).toBe(`${stem}__base ${stem}_s_md ${stem}_c_sm_md`)
    expect(sizes({ size: 'lg' })).toBe(`${stem}__base ${stem}_s_lg`)
    registerRecipeData('test', { [STEM]: TABLE })
  })

  it('collapses a lone ["true"] predicate to the axis key', () => {
    const stem = 'test__muted'
    registerRecipeData('test', {
      [stem]: {
        variantMap: { muted: ['true', 'false'] },
        defaultVariants: { muted: 1 },
        compoundVariants: [{ predicates: { muted: ['true'] } }],
      },
    })
    const muted = recipe({ className: 'muted' })
    expect(muted({ muted: true })).toBe(`${stem}__base ${stem}_m_true ${stem}_c_muted`)
    expect(muted({ muted: false })).toBe(`${stem}__base ${stem}_m_false`)
    registerRecipeData('test', { [STEM]: TABLE })
  })

  it('reads legacy stem, axes, string defaults, and selection records', () => {
    registerRecipeData('test', {
      [STEM]: {
        qualifiedName: STEM,
        variantKeys: ['tone', 'size'],
        variantMap: { tone: ['accent', 'muted'], size: ['sm', 'lg'] },
        defaultVariants: { tone: 'muted', size: 'sm' },
        compoundVariants: [
          {
            selection: { tone: 'accent', size: 'lg' },
            className: `${STEM}_c_accent_lg`,
          },
        ],
      },
    })
    const button = recipe(CONFIG)
    expect(button()).toBe(MUTED_SM)
    expect(button({ tone: 'accent', size: 'lg' })).toBe(ACCENT_LG)
    expect(button({ tone: 'accent', size: 'sm' })).toBe(ACCENT_SM)
    registerRecipeData('test', { [STEM]: TABLE })
  })
})

describe('recipe() responsive selections', () => {
  it('emits the base composition plus one derived class per breakpoint', () => {
    registerRecipeData('test', { [STEM]: TABLE })
    const button = recipe(CONFIG)
    expect(button({ tone: { base: 'muted', md: 'accent' }, size: 'sm' })).toBe(
      `${MUTED_SM} md:${STEM}_t_accent`
    )
    expect(button({ tone: { base: 'muted', md: 'accent', lg: 'muted' }, size: 'sm' })).toBe(
      `${MUTED_SM} md:${STEM}_t_accent lg:${STEM}_t_muted`
    )
  })

  it('falls back to the default when the responsive object omits base', () => {
    registerRecipeData('test', { [STEM]: TABLE })
    const button = recipe(CONFIG)
    expect(button({ tone: { md: 'accent' }, size: 'sm' })).toBe(
      `${MUTED_SM} md:${STEM}_t_accent`
    )
  })

  it('drops skips and unknown breakpoints or values without failing', () => {
    registerRecipeData('test', { [STEM]: TABLE })
    const button = recipe(CONFIG)
    expect(button({ tone: { base: 'muted', md: undefined, lg: null }, size: 'sm' })).toBe(MUTED_SM)
    expect(button({ tone: { base: 'muted', xxl: 'accent' }, size: 'sm' })).toBe(MUTED_SM)
    expect(button({ tone: { base: 'muted', md: 'nope' }, size: 'sm' })).toBe(MUTED_SM)
  })

  it('degrades to base classes when the table carries no breakpoint list', () => {
    const bare: RecipeRuntimeTable = { ...TABLE }
    delete bare.responsiveBreakpoints
    registerRecipeData('test', { [STEM]: bare })
    const button = recipe(CONFIG)
    expect(button({ tone: { base: 'accent', md: 'muted' }, size: 'lg' })).toBe(ACCENT_LG)
    registerRecipeData('test', { [STEM]: TABLE })
  })

  it('reads hoisted breakpoints with table-level winning', () => {
    const bare: RecipeRuntimeTable = { ...TABLE, responsiveBreakpoints: undefined }
    registerRecipeData('test', { [STEM]: bare }, ['md', 'lg'])
    const button = recipe(CONFIG)
    const mdAccent = `${MUTED_SM} md:${STEM}_t_accent`
    expect(button({ tone: { base: 'muted', md: 'accent' }, size: 'sm' })).toBe(mdAccent)
    expect(button({ tone: { base: 'muted', xxl: 'accent' }, size: 'sm' })).toBe(MUTED_SM)
    registerRecipeData('test', { [STEM]: TABLE }, ['xl'])
    expect(button({ tone: { base: 'muted', md: 'accent' }, size: 'sm' })).toBe(mdAccent)
    expect(button({ tone: { base: 'muted', xl: 'accent' }, size: 'sm' })).toBe(MUTED_SM)
    registerRecipeData('test', { [STEM]: TABLE })
  })

  it('reads a legacy shipped responsive map when no breakpoint list exists', () => {
    const bare: RecipeRuntimeTable = { ...TABLE }
    delete bare.responsiveBreakpoints
    registerRecipeData('test', {
      [STEM]: {
        ...bare,
        responsiveVariantMap: {
          tone: { md: { accent: `md:${STEM}_t_accent` } },
        },
      },
    })
    const button = recipe(CONFIG)
    expect(button({ tone: { base: 'muted', md: 'accent' }, size: 'sm' })).toBe(
      `${MUTED_SM} md:${STEM}_t_accent`
    )
    registerRecipeData('test', { [STEM]: TABLE })
  })

  it('resolves raw styles through the responsive base value', () => {
    registerRecipeData('test', { [STEM]: TABLE })
    const button = recipe(CONFIG)
    expect(button.raw({ tone: { base: 'accent', md: 'muted' }, size: 'lg' })).toEqual({
      display: 'inline-flex',
      color: 'brand',
      p: 'lg',
      backgroundColor: 'ink',
    })
    registerRecipeData('test', { [STEM]: TABLE })
  })
})

describe('recipe() metadata', () => {
  it('exposes variant keys, maps, and prop splitting', () => {
    const button = recipe(CONFIG)
    expect(button.variantKeys).toEqual(['tone', 'size'])
    expect(button.variantMap).toEqual({ tone: ['accent', 'muted'], size: ['sm', 'lg'] })
    expect(button.splitVariantProps({ tone: 'accent', id: 'x' })).toEqual([
      { tone: 'accent' },
      { id: 'x' },
    ])
  })

  it('merges raw styles across base, variants, and matching compounds', () => {
    const button = recipe(CONFIG)
    expect(button.raw({ tone: 'accent', size: 'lg' })).toEqual({
      display: 'inline-flex',
      color: 'brand',
      p: 'lg',
      backgroundColor: 'ink',
    })
    expect(button.raw({ tone: 'accent', size: 'sm' })).toEqual({
      display: 'inline-flex',
      color: 'brand',
      p: 'sm',
    })
  })
})

describe('recipe() responsive lowering', () => {
  it('lowers r sugar across every section without mutating the input', () => {
    const config: RecipeConfig = {
      className: 'button',
      base: { display: 'grid', r: { 320: { gap: '2r' } } },
      variants: {
        tone: { accent: { r: { 640: { color: 'brand' } } } },
      },
      compoundVariants: [
        { tone: 'accent', css: { _hover: { r: { 960: { color: 'ink' } } } } },
      ],
    }
    const button = recipe(config)
    expect(button.raw({ tone: 'accent' })).toEqual({
      display: 'grid',
      '@container (min-width: 320px)': { gap: '2r' },
      '@container (min-width: 640px)': { color: 'brand' },
      _hover: { '@container (min-width: 960px)': { color: 'ink' } },
    })
    expect(config).toEqual({
      className: 'button',
      base: { display: 'grid', r: { 320: { gap: '2r' } } },
      variants: {
        tone: { accent: { r: { 640: { color: 'brand' } } } },
      },
      compoundVariants: [
        { tone: 'accent', css: { _hover: { r: { 960: { color: 'ink' } } } } },
      ],
    })
  })

  it('leaves unsupported responsive shapes untouched', () => {
    const button = recipe({
      className: 'button',
      base: { r: { sidebar: { p: 'sm' } } },
    })
    expect(button.raw()).toEqual({ r: { sidebar: { p: 'sm' } } })
  })
})

describe('recipe() without registration', () => {
  it('throws loud on a fresh module', async () => {
    vi.resetModules()
    const fresh = await import('./recipe.ts')
    const button = fresh.recipe(CONFIG)

    expect(() => button({ tone: 'accent' })).toThrowError(/registerRecipeData/)
  })
})
