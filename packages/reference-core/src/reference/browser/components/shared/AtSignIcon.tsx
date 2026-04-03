// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/shared/AtSignIcon.tsx
import * as React from 'react'

export type AtSignIconProps = React.SVGProps<SVGSVGElement> & {
  /** Sets both width and height when explicit `width` / `height` are not passed. */
  size?: number | string
}

/**
 * “At” / mention glyph (SVG Repo asset), as a small inline icon.
 * Stroke uses `currentColor` so `color` / `className` on the SVG control the look.
 */
export const AtSignIcon = React.forwardRef<SVGSVGElement, AtSignIconProps>(
  function AtSignIcon(
    { size = 24, width, height, className, stroke = 'currentColor', ...rest },
    ref
  ) {
    const w = width ?? size
    const h = height ?? size

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        width={w}
        height={h}
        className={className}
        stroke={stroke}
        aria-hidden
        {...rest}
      >
        <path
          d="M17.4009 19.2C15.8965 20.3302 14.0265 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12V13.5C21 14.8807 19.8807 16 18.5 16C17.1193 16 16 14.8807 16 13.5V8M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
)
