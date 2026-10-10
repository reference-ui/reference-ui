/**
 * Switch root: a labeled on/off track with exactly one thumb. The component
 * composes checked state and authored-thumb presence from the hooks, fans
 * the host node into its internal handle plus the forwarded ref, then renders
 * the context provider over one Button — consumer children first, the default
 * thumb only when none was authored. The root owns its managed ARIA/state:
 * consumer conflicts lose, and aria-pressed is dropped.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import type { SwitchProps } from './types'
import { SwitchContext } from './context'
import { SwitchThumb } from './parts/Thumb'
import { useAuthoredThumbPresence, useCheckedState } from './hooks'
import { composeRefs } from './shared/refs'

export type { SwitchProps, SwitchThumbProps } from './types'

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      children,
      checked: checkedProp,
      defaultChecked = false,
      onChange,
      disabled = false,
      onClick,
      style,
      className,
      ...props
    },
    ref
  ) {
    const { checked, isControlled, acceptChecked } = useCheckedState({
      checked: checkedProp,
      defaultChecked,
    })

    const rootNodeRef = React.useRef<HTMLButtonElement | null>(null)
    const authoredThumbPresent = useAuthoredThumbPresence({ children, rootNodeRef })
    const rootRef = React.useMemo(() => composeRefs(rootNodeRef, ref), [ref])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented && !disabled) {
        const nextChecked = !checked
        if (!isControlled) {
          acceptChecked(nextChecked)
        }
        onChange?.(nextChecked, e)
      }
    }

    const contextValue = React.useMemo(
      () => ({ checked, disabled }),
      [checked, disabled]
    )

    // Root owns its managed ARIA/state: consumer conflicts lose, aria-pressed is dropped.
    const managedProps = { ...props } as Record<string, any>
    delete managedProps['aria-pressed']

    return (
      <SwitchContext.Provider value={contextValue}>
        <Button
          {...managedProps}
          type="button"
          role="switch"
          ref={rootRef}
          disabled={disabled}
          aria-checked={checked}
          data-reference-switch=""
          data-state={checked ? 'checked' : 'unchecked'}
          data-disabled={disabled ? '' : undefined}
          onClick={handleClick}
          className={className}
          style={style}
        >
          {children}
          {!authoredThumbPresent && <SwitchThumb />}
        </Button>
      </SwitchContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>> & {
  Thumb: typeof SwitchThumb
}

Switch.Thumb = SwitchThumb
