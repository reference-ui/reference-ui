import { createElement, forwardRef } from 'react'

import { splitProps } from '../helpers.js';
import { getResponsiveContainerStyle } from '../patterns/responsive-container.js';
import { styled } from './factory.js';

export const ResponsiveContainer = /* @__PURE__ */ forwardRef(function ResponsiveContainer(props, ref) {
  const [patternProps, restProps] = splitProps(props, ["r","container"])

const styleProps = getResponsiveContainerStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(styled.div, mergedProps)
  })