import { getPatternStyles, patternFns } from '../helpers.js'
import { css } from '../css/index.js'

const jsxConfig = {}

export const getJsxStyle = (styles = {}) => {
  const _styles = getPatternStyles(jsxConfig, styles)
  return jsxConfig.transform(_styles, patternFns)
}

export const jsx = styles => css(getJsxStyle(styles))
jsx.raw = getJsxStyle
