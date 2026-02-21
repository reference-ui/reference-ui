import { createElement, forwardRef } from 'react'

import { splitProps } from '../helpers.js'
import { getContainerSetupStyle } from '../patterns/container-setup.js'
import { styled } from './factory.js'

export const ContainerSetup = /* @__PURE__ */ forwardRef(
  function ContainerSetup(props, ref) {
    const [patternProps, restProps] = splitProps(props, ['container'])

    const styleProps = getContainerSetupStyle(patternProps)
    const mergedProps = { ref, ...styleProps, ...restProps }

    return createElement(styled.div, mergedProps)
  }
)
