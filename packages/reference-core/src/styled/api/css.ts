/**
 * Wraps Panda's css() so style objects exclude deprecated CSS system colors
 * (e.g. "Background", "ButtonFace") from type suggestions / acceptance.
 */

import { css as pandaCss } from '../../system/css/index.js'
import type { SystemStyleObject } from '../../system/types/index.js'
import type { OmitDeprecatedColorProps } from '../deprecated-colors'

type Styles = OmitDeprecatedColorProps<SystemStyleObject> | undefined | null | false

/** Same as Panda css() but style args omit deprecated system color literals. */
function css(styles: Styles): string
function css(styles: Styles[]): string
function css(...styles: Array<Styles | Styles[]>): string
function css(...styles: Array<Styles | Styles[]>): string {
  return pandaCss(...styles)
}

css.raw = pandaCss.raw

export { css }
