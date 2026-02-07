/**
 * Creates a Box-based primitive with the correct ref type for the element.
 * Uses Box with as={tag} so Panda codegen picks it up. Ref is type-guarded
 * to match the rendered element (e.g. HTMLButtonElement for button).
 */

import { forwardRef } from 'react';
import { Box } from '../system/jsx/box.js';
import type { PrimitiveElement, PrimitiveProps } from './types.js';

export function createBoxPrimitive<T extends keyof React.JSX.IntrinsicElements>(
  tag: T,
): React.ForwardRefExoticComponent<
  PrimitiveProps<T> & React.RefAttributes<PrimitiveElement<T>>
> {
  return forwardRef(function BoxPrimitive(props, ref) {
    const { as: _, ...rest } = props as React.ComponentProps<typeof Box>;
    return <Box as={tag} ref={ref as React.Ref<HTMLDivElement>} {...rest} />;
  }) as React.ForwardRefExoticComponent<
    PrimitiveProps<T> & React.RefAttributes<PrimitiveElement<T>>
  >;
}
