import { createElement, forwardRef } from 'react'

import { splitProps } from '../helpers.js';
import { getJsxStyle } from '../patterns/jsx.js';
import { styled } from './factory.js';

export const Jsx = /* @__PURE__ */ forwardRef(function Jsx(props, ref) {
  const [patternProps, restProps] = splitProps(props, [])

const styleProps = getJsxStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(styled.div, mergedProps)
  })