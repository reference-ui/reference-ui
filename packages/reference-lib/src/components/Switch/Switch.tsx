import * as React from 'react'
import { Button, Span, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'

export type SwitchProps = Omit<
  PrimitiveProps<'button'>,
  'onChange' | 'role' | 'type' | 'aria-checked' | 'aria-pressed' | 'data-state' | 'data-disabled'
> & {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}

export type SwitchThumbProps = PrimitiveProps<'span'>

interface SwitchContextValue {
  checked: boolean
  disabled: boolean
}

const SwitchContext = React.createContext<SwitchContextValue | null>(null)

// Layout before paint in the browser (pre-paint default-thumb
// reconciliation), plain effect on the server where layout effects warn.
const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

function composeRefs<T>(...refs: (React.Ref<T> | undefined | null)[]) {
  return (node: T | null) => {
    const cleanups: (() => void)[] = []
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node)
        if (typeof cleanup === 'function') {
          cleanups.push(cleanup)
        }
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<T | null>).current = node
      }
    }
    if (cleanups.length > 0) {
      return () => {
        for (const cleanup of cleanups) {
          cleanup()
        }
      }
    }
  }
}

// Static seed for the direct-authored shape only: reference identity, no
// displayName read, no fragment penetration. Seeds initial state so the
// first paint (including SSR) is already correct; Fragment-wrapped and
// HOC-forwarded thumbs are reconciled from rendered DOM structure below.
function hasDirectAuthoredThumb(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some(
    child => React.isValidElement(child) && child.type === SwitchThumb
  )
}

export const SwitchThumb = React.forwardRef<HTMLSpanElement, SwitchThumbProps>(
  function SwitchThumb({ className, style, ...props }, ref) {
    const context = React.useContext(SwitchContext)
    const checked = context?.checked ?? false
    const disabled = context?.disabled ?? false

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
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
    const isControlled = checkedProp !== undefined
    const checked = isControlled ? checkedProp : internalChecked

    // Structural thumb identity: the rendered DOM is the source of truth
    // for whether an authored thumb exists, so Fragment-wrapped and
    // HOC-forwarded thumbs suppress the default without element probing.
    const [authoredThumbPresent, setAuthoredThumbPresent] = React.useState(
      () => hasDirectAuthoredThumb(children)
    )
    const rootNodeRef = React.useRef<HTMLButtonElement | null>(null)
    const rootRef = React.useMemo(() => composeRefs(rootNodeRef, ref), [ref])

    useIsomorphicLayoutEffect(() => {
      const root = rootNodeRef.current
      if (!root) return
      let thumbs = 0
      for (const el of root.children) {
        if (el.hasAttribute('data-reference-switch-thumb')) thumbs++
      }
      if (authoredThumbPresent) {
        if (thumbs === 0) setAuthoredThumbPresent(false)
      } else if (thumbs > 1) {
        setAuthoredThumbPresent(true)
      }
    })

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented && !disabled) {
        const nextChecked = !checked
        if (!isControlled) {
          setInternalChecked(nextChecked)
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

SwitchThumb.displayName = 'SwitchThumb'
Switch.Thumb = SwitchThumb
