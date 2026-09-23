import { css as styledCss } from '@reference-ui/styled/css'
import type { CssFunction, CssRawFunction, CssStyles } from '../../../types'
import type { SystemStyleObject } from '../../../types'
import { lowerResponsiveStyles } from './lowerResponsiveStyles'

// Reference UI extends Panda's generated css() runtime at this seam.
// Panda still owns class generation and utility resolution; we preprocess
// Reference-owned style syntax first so runtime class lookup matches the
// build-time lowering we perform in virtual.
type StyledCssInput = Parameters<typeof styledCss>[number]
type StyledCssRawInput = Parameters<typeof styledCss.raw>[number]

function customCssRawFn(styles: CssStyles): SystemStyleObject
function customCssRawFn(styles: CssStyles[]): SystemStyleObject
function customCssRawFn(...styles: Array<CssStyles | CssStyles[]>): SystemStyleObject
function customCssRawFn(...styles: Array<CssStyles | CssStyles[]>): SystemStyleObject {
  return styledCss.raw(
    ...(styles.map(style => lowerResponsiveStyles(style)) as unknown as StyledCssRawInput[])
  ) as SystemStyleObject
}

function customCssFn(styles: CssStyles): string
function customCssFn(styles: CssStyles[]): string
function customCssFn(...styles: Array<CssStyles | CssStyles[]>): string
function customCssFn(...styles: Array<CssStyles | CssStyles[]>): string {
  return styledCss(...(styles.map(style => lowerResponsiveStyles(style)) as unknown as StyledCssInput[]))
}

customCssFn.raw = customCssRawFn as CssRawFunction

export { customCssFn }
export type { CssFunction }