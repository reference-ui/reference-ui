import { describe, expectTypeOf, it } from 'vitest'
import type { RecipeVariantFn } from '@reference-ui/styled/types/recipe'
import type {
  BaseSystem,
  ColorModeProps,
  ColorPropKeys,
  ContainerProps,
  CssFunction,
  CssRawFunction,
  CssStyles,
  FontName,
  FontProps,
  FontRegistry,
  FontWeightName,
  HTMLStyledProps,
  PrimitiveComponent,
  PrimitiveCssProps,
  PrimitiveElement,
  PrimitiveProps,
  PrimitiveTag,
  RecipeCreatorFn,
  RecipeDefinition,
  RecipeRuntimeFn,
  RecipeSelection,
  RecipeVariant,
  RecipeVariantProps,
  ResponsiveProps,
  StyleProps,
  StylePropValue,
  SystemStyleObject,
} from '@reference-ui/react'

type StringKey<T> = Extract<keyof T, string>

/** Minimal variant map for exercising Panda recipe generics (generated `styled` types). */
type SmokeRecipeVariants = { size: { sm: {}; lg: {} } }
type SmokeRecipeFn = RecipeVariantFn<SmokeRecipeVariants>

/**
 * Smoke-test design-system types from `ref sync` → `.reference-ui/react` (`react.d.mts`).
 * Grouped like `reference-core/src/types`; one `it` per type for precise failures.
 */
describe('generated @reference-ui/react (design-system types)', () => {
  describe('BaseSystem', () => {
    // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
    it.skip('BaseSystem', () => {
      expectTypeOf<BaseSystem>().not.toEqualTypeOf<never>()
    })
  })

  describe('css', () => {
    // TODO(matrix/distro): Matrix distro exercises css() at runtime and via
    // CssStyles assignments, but it does not yet assert the exported CssFunction type alias.
    it('CssFunction', () => {
      expectTypeOf<CssFunction>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): Matrix distro exercises css.raw() return behavior,
    // but it does not yet assert the exported CssRawFunction type alias.
    it('CssRawFunction', () => {
      expectTypeOf<CssRawFunction>().not.toEqualTypeOf<never>()
    })
    // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
    it.skip('CssStyles', () => {
      expectTypeOf<CssStyles>().not.toEqualTypeOf<never>()
    })
  })

  describe('colors', () => {
    // TODO(matrix/distro): Matrix distro proves token-safe consumer props, but
    // does not yet assert the exported ColorPropKeys helper type directly.
    it('ColorPropKeys', () => {
      expectTypeOf<ColorPropKeys>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): Matrix distro proves some token-aware style usage,
    // but does not yet assert the exported SystemStyleObject alias directly.
    it('SystemStyleObject', () => {
      expectTypeOf<SystemStyleObject>().not.toEqualTypeOf<never>()
    })
  })

  describe('props (theme + style)', () => {
    // TODO(matrix/distro): No matrix test currently asserts the exported
    // ColorModeProps type surface directly.
    it('ColorModeProps', () => {
      expectTypeOf<ColorModeProps>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts the exported
    // ContainerProps type surface directly.
    it('ContainerProps', () => {
      expectTypeOf<ContainerProps>().not.toEqualTypeOf<never>()
    })
    // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
    it.skip('ResponsiveProps', () => {
      expectTypeOf<ResponsiveProps>().not.toEqualTypeOf<never>()
    })
    // MIGRATED: Covered by matrix/font/tests/unit/runtime.test.ts.
    it.skip('FontProps', () => {
      expectTypeOf<FontProps>().not.toEqualTypeOf<never>()
    })
    // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
    it.skip('StyleProps', () => {
      expectTypeOf<StyleProps>().not.toEqualTypeOf<never>()
    })
    // MIGRATED: Covered by matrix/distro/tests/unit/distro.test.tsx.
    it.skip('StyleProps includes size', () => {
      expectTypeOf<StyleProps>().toMatchTypeOf<{ size?: unknown }>()
    })
    // TODO(matrix/distro): No matrix test currently asserts the exported
    // StylePropValue helper type directly.
    it('StylePropValue<string>', () => {
      expectTypeOf<StylePropValue<string>>().not.toEqualTypeOf<never>()
    })
  })

  describe('primitives', () => {
    // TODO(matrix/distro): Matrix distro covers consumer DivProps and one
    // PrimitiveProps instantiation, but not PrimitiveCssProps directly.
    it('PrimitiveCssProps', () => {
      expectTypeOf<PrimitiveCssProps>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts the exported
    // PrimitiveTag alias directly.
    it('PrimitiveTag', () => {
      expectTypeOf<PrimitiveTag>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): Matrix distro only asserts PrimitiveProps<'button'>;
    // keep this direct div instantiation smoke until that generic surface is covered.
    it("PrimitiveProps<'div'>", () => {
      expectTypeOf<PrimitiveProps<'div'>>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts PrimitiveElement<'div'> directly.
    it("PrimitiveElement<'div'>", () => {
      expectTypeOf<PrimitiveElement<'div'>>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts PrimitiveComponent<'div'> directly.
    it("PrimitiveComponent<'div'>", () => {
      expectTypeOf<PrimitiveComponent<'div'>>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts HTMLStyledProps<'div'> directly.
    it("HTMLStyledProps<'div'>", () => {
      expectTypeOf<HTMLStyledProps<'div'>>().not.toEqualTypeOf<never>()
    })
  })

  describe('recipe (re-exported from styled)', () => {
    // TODO(matrix/distro): Matrix distro exercises recipe() at runtime, but not
    // the exported RecipeCreatorFn helper type directly.
    it('RecipeCreatorFn', () => {
      expectTypeOf<RecipeCreatorFn>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts RecipeDefinition directly.
    it('RecipeDefinition', () => {
      expectTypeOf<RecipeDefinition>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): Matrix distro proves recipe runtime output, but not
    // the exported RecipeRuntimeFn generic directly.
    it('RecipeRuntimeFn<SmokeRecipeVariants>', () => {
      expectTypeOf<RecipeRuntimeFn<SmokeRecipeVariants>>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts RecipeSelection directly.
    it('RecipeSelection<SmokeRecipeVariants>', () => {
      expectTypeOf<RecipeSelection<SmokeRecipeVariants>>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts RecipeVariant directly.
    it('RecipeVariant<SmokeRecipeFn>', () => {
      expectTypeOf<RecipeVariant<SmokeRecipeFn>>().not.toEqualTypeOf<never>()
    })
    // TODO(matrix/distro): No matrix test currently asserts RecipeVariantProps directly.
    it('RecipeVariantProps<SmokeRecipeFn>', () => {
      expectTypeOf<RecipeVariantProps<SmokeRecipeFn>>().not.toEqualTypeOf<never>()
    })
  })

  describe('font registry', () => {
    // MIGRATED: Covered by matrix/font/tests/unit/runtime.test.ts.
    it.skip('FontRegistry', () => {
      expectTypeOf<FontRegistry>().not.toEqualTypeOf<never>()
    })
    // MIGRATED: Covered by matrix/font/tests/unit/runtime.test.ts.
    it.skip('FontName', () => {
      expectTypeOf<FontName>().toEqualTypeOf<StringKey<FontRegistry>>()
    })
    // MIGRATED: Covered by matrix/font/tests/unit/runtime.test.ts.
    it.skip('FontWeightName<FontName>', () => {
      expectTypeOf<FontWeightName<FontName>>().toEqualTypeOf<
        StringKey<FontRegistry[FontName]>
      >()
    })
  })
})
