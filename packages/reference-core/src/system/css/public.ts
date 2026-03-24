import { css as styledCss } from '@reference-ui/styled/css'
import type { CssFunction, CssRawFunction, CssStyles } from '../../types'
import type { StrictColorProps, SystemStyleObject } from '../../types'

// The public type surface is Reference UI-owned even though the current
// implementation still delegates to the generated styled-system runtime.
type StyledCssInput = Parameters<typeof styledCss>[number]
type StyledCssRawInput = Parameters<typeof styledCss.raw>[number]

function raw(styles: CssStyles): StrictColorProps<SystemStyleObject>
function raw(styles: CssStyles[]): StrictColorProps<SystemStyleObject>
function raw(...styles: Array<CssStyles | CssStyles[]>): StrictColorProps<SystemStyleObject>
function raw(...styles: Array<CssStyles | CssStyles[]>): StrictColorProps<SystemStyleObject> {
  return styledCss.raw(...(styles as unknown as StyledCssRawInput[])) as StrictColorProps<SystemStyleObject>
}

function css(styles: CssStyles): string
function css(styles: CssStyles[]): string
function css(...styles: Array<CssStyles | CssStyles[]>): string
function css(...styles: Array<CssStyles | CssStyles[]>): string {
  return styledCss(...(styles as unknown as StyledCssInput[]))
}

css.raw = raw as CssRawFunction

export const publicCss: CssFunction = css
export { publicCss as css }
