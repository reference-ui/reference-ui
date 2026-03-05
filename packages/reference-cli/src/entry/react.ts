/**
 * @reference-ui/react entry
 * Runtime React components and APIs
 */

import type React from 'react'
import type { SystemStyleObject } from '@reference-ui/styled/types'

export { Div } from '../system/primitives'
export { css } from '@reference-ui/styled/css'
export { cva, cva as recipe } from '@reference-ui/styled/css/cva'
export type { RecipeVariantProps } from '@reference-ui/styled/css/cva'
export type { SystemStyleObject } from '@reference-ui/styled/types'
export type BoxProps = React.ComponentPropsWithoutRef<'div'> & SystemStyleObject
export type ResponsiveBreakpoints = { [breakpoint: number]: SystemStyleObject }
