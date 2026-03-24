import { css as styledCss } from '@reference-ui/styled/css'
import type { CssFunction, CssRawFunction, CssStyles } from '../../types'
import type { StrictColorProps, SystemStyleObject } from '../../types'

function raw(styles: CssStyles): StrictColorProps<SystemStyleObject>
function raw(styles: CssStyles[]): StrictColorProps<SystemStyleObject>
function raw(...styles: Array<CssStyles | CssStyles[]>): StrictColorProps<SystemStyleObject>
function raw(...styles: Array<CssStyles | CssStyles[]>): StrictColorProps<SystemStyleObject> {
  return styledCss.raw(...styles) as StrictColorProps<SystemStyleObject>
}

function css(styles: CssStyles): string
function css(styles: CssStyles[]): string
function css(...styles: Array<CssStyles | CssStyles[]>): string
function css(...styles: Array<CssStyles | CssStyles[]>): string {
  return styledCss(...styles)
}

css.raw = raw as CssRawFunction

export const publicCss: CssFunction = css
export { publicCss as css }
