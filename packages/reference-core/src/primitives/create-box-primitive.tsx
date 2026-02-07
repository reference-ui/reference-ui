/**
 * Creates a Box-based primitive with the correct ref type for the element.
 * Uses Panda's styled[tag] directly instead of Box as={tag}, so ref is
 * properly typed as the element's DOM type (e.g. HTMLButtonElement for button).
 */

import { createElement, forwardRef } from 'react';
import { splitProps } from '../system/helpers.js';
import { getBoxStyle } from '../system/patterns/box.js';
import { styled } from '../system/jsx/factory.js';
import type { PrimitiveElement, PrimitiveProps } from './types.js';

export function createBoxPrimitive<T extends keyof React.JSX.IntrinsicElements>(
  tag: T,
): React.ForwardRefExoticComponent<
  PrimitiveProps<T> & React.RefAttributes<PrimitiveElement<T>>
> {
  const Styled = styled[tag] as React.ComponentType<any>;
  return forwardRef(function BoxPrimitive(props, ref) {
    const [patternProps, restProps] = splitProps(props, ['r', 'container']);
    const styleProps = getBoxStyle(patternProps);
    const mergedProps = { ref, ...styleProps, ...restProps };
    return createElement(Styled, mergedProps);
  }) as React.ForwardRefExoticComponent<
    PrimitiveProps<T> & React.RefAttributes<PrimitiveElement<T>>
  >;
}
