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
  ReferenceProps,
  ResponsiveProps,
  SafeColorProps,
  StrictColorProps,
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
    it('BaseSystem', () => {
      expectTypeOf<BaseSystem>().not.toEqualTypeOf<never>()
    })
  })

  describe('css', () => {
    it('CssFunction', () => {
      expectTypeOf<CssFunction>().not.toEqualTypeOf<never>()
    })
    it('CssRawFunction', () => {
      expectTypeOf<CssRawFunction>().not.toEqualTypeOf<never>()
    })
    it('CssStyles', () => {
      expectTypeOf<CssStyles>().not.toEqualTypeOf<never>()
    })
  })

  describe('colors', () => {
    it('ColorPropKeys', () => {
      expectTypeOf<ColorPropKeys>().not.toEqualTypeOf<never>()
    })
    it('SafeColorProps', () => {
      expectTypeOf<SafeColorProps>().not.toEqualTypeOf<never>()
    })
    it('StrictColorProps<SystemStyleObject>', () => {
      expectTypeOf<StrictColorProps<SystemStyleObject>>().not.toEqualTypeOf<never>()
    })
    it('SystemStyleObject', () => {
      expectTypeOf<SystemStyleObject>().not.toEqualTypeOf<never>()
    })
  })

  describe('props (theme + style)', () => {
    it('ColorModeProps', () => {
      expectTypeOf<ColorModeProps>().not.toEqualTypeOf<never>()
    })
    it('ContainerProps', () => {
      expectTypeOf<ContainerProps>().not.toEqualTypeOf<never>()
    })
    it('ResponsiveProps', () => {
      expectTypeOf<ResponsiveProps>().not.toEqualTypeOf<never>()
    })
    it('ReferenceProps', () => {
      expectTypeOf<ReferenceProps>().not.toEqualTypeOf<never>()
    })
    it('FontProps', () => {
      expectTypeOf<FontProps>().not.toEqualTypeOf<never>()
    })
    it('StyleProps', () => {
      expectTypeOf<StyleProps>().not.toEqualTypeOf<never>()
    })
    it('StylePropValue<string>', () => {
      expectTypeOf<StylePropValue<string>>().not.toEqualTypeOf<never>()
    })
  })

  describe('primitives', () => {
    it('PrimitiveCssProps', () => {
      expectTypeOf<PrimitiveCssProps>().not.toEqualTypeOf<never>()
    })
    it('PrimitiveTag', () => {
      expectTypeOf<PrimitiveTag>().not.toEqualTypeOf<never>()
    })
    it("PrimitiveProps<'div'>", () => {
      expectTypeOf<PrimitiveProps<'div'>>().not.toEqualTypeOf<never>()
    })
    it("PrimitiveElement<'div'>", () => {
      expectTypeOf<PrimitiveElement<'div'>>().not.toEqualTypeOf<never>()
    })
    it("PrimitiveComponent<'div'>", () => {
      expectTypeOf<PrimitiveComponent<'div'>>().not.toEqualTypeOf<never>()
    })
    it("HTMLStyledProps<'div'>", () => {
      expectTypeOf<HTMLStyledProps<'div'>>().not.toEqualTypeOf<never>()
    })
  })

  describe('recipe (re-exported from styled)', () => {
    it('RecipeCreatorFn', () => {
      expectTypeOf<RecipeCreatorFn>().not.toEqualTypeOf<never>()
    })
    it('RecipeDefinition', () => {
      expectTypeOf<RecipeDefinition>().not.toEqualTypeOf<never>()
    })
    it('RecipeRuntimeFn<SmokeRecipeVariants>', () => {
      expectTypeOf<RecipeRuntimeFn<SmokeRecipeVariants>>().not.toEqualTypeOf<never>()
    })
    it('RecipeSelection<SmokeRecipeVariants>', () => {
      expectTypeOf<RecipeSelection<SmokeRecipeVariants>>().not.toEqualTypeOf<never>()
    })
    it('RecipeVariant<SmokeRecipeFn>', () => {
      expectTypeOf<RecipeVariant<SmokeRecipeFn>>().not.toEqualTypeOf<never>()
    })
    it('RecipeVariantProps<SmokeRecipeFn>', () => {
      expectTypeOf<RecipeVariantProps<SmokeRecipeFn>>().not.toEqualTypeOf<never>()
    })
  })

  describe('font registry', () => {
    it('FontRegistry', () => {
      expectTypeOf<FontRegistry>().not.toEqualTypeOf<never>()
    })
    it('FontName', () => {
      expectTypeOf<FontName>().toEqualTypeOf<StringKey<FontRegistry>>()
    })
    it('FontWeightName<FontName>', () => {
      expectTypeOf<FontWeightName<FontName>>().toEqualTypeOf<
        StringKey<FontRegistry[FontName]>
      >()
    })
  })
})
