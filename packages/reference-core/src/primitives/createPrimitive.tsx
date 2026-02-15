/**
 * Type-safe primitive component factory using Panda's Box component internally.
 *
 * CRITICAL: This uses Box with the 'as' prop internally, but NEVER exposes 'as'
 * to the external API. This prevents TypeScript brittleness while leveraging
 * Panda's native pattern support for r, container, and font props.
 */

import * as React from 'react';
import { forwardRef } from 'react';
import { Box } from '../system/jsx/box.js';
import { cx } from '../system/css/index.js';
import type { PrimitiveProps, PrimitiveElement } from './types.js';

/**
 * Creates a type-safe primitive component that uses Box internally with the 'as' prop.
 *
 * @param tag - The HTML tag to render (e.g., 'div', 'button', 'a')
 * @param recipeClassName - Optional Panda recipe className to apply
 * @returns A strongly-typed primitive component
 *
 * @example
 * ```tsx
 * const Button = createPrimitive('button')
 * const StrongText = createPrimitive('strong', strongStyle())
 * ```
 */
export function createPrimitive<T extends keyof React.JSX.IntrinsicElements>(
  tag: T,
  recipeClassName?: string,
) {
  const displayName = tag.charAt(0).toUpperCase() + tag.slice(1);

  const Primitive = forwardRef<PrimitiveElement<T>, PrimitiveProps<T>>(
    (props, ref) => {
      // Type-safe extraction - className is part of HTMLStyledProps via React.DOMAttributes
      const { className, ...rest } = props as PrimitiveProps<T> & {
        className?: string;
      };

      // Type-guard: Cast 'as' prop internally, never exposed externally
      // This is safe because PrimitiveProps<T> ensures all props match the tag type
      const boxProps: any = {
        ...rest,
        as: tag,
        ref,
        className: recipeClassName ? cx(recipeClassName, className) : className,
      };

      return <Box {...boxProps} />;
    },
  );

  Primitive.displayName = displayName;

  // Force the correct type - this is safe because:
  // - PrimitiveProps<T> deliberately omits 'as'
  // - The ref type matches the actual HTML element
  // - We're using Box internally which handles all the Panda props (r, container, font)
  return Primitive as React.ForwardRefExoticComponent<
    PrimitiveProps<T> & React.RefAttributes<PrimitiveElement<T>>
  >;
}
