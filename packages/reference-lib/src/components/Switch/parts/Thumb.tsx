/**
 * Switch's compound thumb: the sliding knob inside the track. Reads checked
 * and disabled from the switch context (defaulting to unchecked/enabled
 * outside a provider), then renders one Span carrying the thumb marker the
 * root's structural detection counts, with the slide transform inline so the
 * resting position paints before any stylesheet resolves.
 */
import * as React from 'react'
import { Span } from '@reference-ui/react'
import type { SwitchThumbProps } from '../types'
import { useSwitchContext } from '../context'

export const SwitchThumb = React.forwardRef<HTMLSpanElement, SwitchThumbProps>(
  function SwitchThumb({ className, style, ...props }, ref) {
    const { checked, disabled } = useSwitchContext()

    return (
      <Span
        ref={ref}
        data-reference-switch-thumb=""
        data-state={checked ? 'checked' : 'unchecked'}
        data-disabled={disabled ? '' : undefined}
        className={className}
        style={{
          transform: checked ? 'translateX(1.25rem)' : 'translateX(0)',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          ...style,
        }}
        {...props}
      />
    )
  }
)

SwitchThumb.displayName = 'SwitchThumb'
