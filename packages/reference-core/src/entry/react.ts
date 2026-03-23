/**
 * @reference-ui/react entry
 * Runtime React components and APIs
 */

import type React from 'react'
import type { SystemStyleObject } from '@reference-ui/styled/types'
import type { ReferenceSystemStyleObject } from '../system/types'

export * from '../system/primitives'
export { css } from '@reference-ui/styled/css'
export { cva, cva as recipe } from '@reference-ui/styled/css/cva'
export type {
  RecipeCreatorFn,
  RecipeDefinition,
  RecipeRuntimeFn,
  RecipeSelection,
  RecipeVariant,
  RecipeVariantProps,
} from '../types'
export type { SystemStyleObject } from '@reference-ui/styled/types'
export type {
  ReferenceFontName,
  ReferenceFontProps,
  ReferenceFontRegistry,
  ReferenceFontWeightName,
  ReferenceFontWeightValue,
  ReferenceSystemStyleObject,
} from '../system/types'
export type BoxProps = React.ComponentPropsWithoutRef<'div'> & ReferenceSystemStyleObject
export type ResponsiveBreakpoints = { [breakpoint: number]: SystemStyleObject }
