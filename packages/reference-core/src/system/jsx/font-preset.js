import { createElement, forwardRef } from 'react'

import { splitProps } from '../helpers.js'
import { getFontPresetStyle } from '../patterns/font-preset.js'
import { styled } from './factory.js'

export const FontPreset = /* @__PURE__ */ forwardRef(function FontPreset(props, ref) {
  const [patternProps, restProps] = splitProps(props, ['font'])

  const styleProps = getFontPresetStyle(patternProps)
  const mergedProps = { ref, ...styleProps, ...restProps }

  return createElement(styled.div, mergedProps)
})
