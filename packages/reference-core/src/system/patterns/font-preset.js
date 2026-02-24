import { getPatternStyles, patternFns } from '../helpers.js'
import { css } from '../css/index.js'

const fontPresetConfig = {
  transform(props) {
    const { font, ...rest } = props
    const FONT_PRESETS = {
      sans: { fontFamily: 'sans', letterSpacing: '-0.01em', fontWeight: '400' },
      serif: { fontFamily: 'serif', letterSpacing: 'normal', fontWeight: '373' },
      mono: { fontFamily: 'mono', letterSpacing: '-0.04em', fontWeight: '393' },
    }
    const fontStyles = font ? FONT_PRESETS[font] || {} : {}
    return {
      ...fontStyles,
      ...rest,
    }
  },
}

export const getFontPresetStyle = (styles = {}) => {
  const _styles = getPatternStyles(fontPresetConfig, styles)
  return fontPresetConfig.transform(_styles, patternFns)
}

export const fontPreset = styles => css(getFontPresetStyle(styles))
fontPreset.raw = getFontPresetStyle
