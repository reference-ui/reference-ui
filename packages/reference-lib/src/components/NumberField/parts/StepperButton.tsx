/**
 * The shared stepper engine behind Increment and Decrement: managed
 * authority stripping, bound capability, the required-name gate,
 * named-part registration, and the press-and-hold session. The two
 * public parts differ only in kind — action, bound edge, diagnostic
 * label, and fallback icon — so they render this base with their kind
 * and stay thin named wrappers for the anatomy scan.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { NumberFieldContext, NumberFieldGroupContext } from '../context'
import type { NumberFieldDecrementProps, NumberFieldIncrementProps } from '../types'
import { useIsomorphicLayoutEffect } from '../shared/dom'
import { useStepperName } from '../hooks/use-stepper-name'
import { useStepperRepeat } from '../hooks/use-stepper-repeat'

export type StepperKind = 'increment' | 'decrement'

export type StepperButtonProps = (
  | NumberFieldIncrementProps
  | NumberFieldDecrementProps
) & {
  kind: StepperKind
}

function StepperIcon({ kind }: { kind: StepperKind }) {
  if (kind === 'increment') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export const StepperButton = React.forwardRef<HTMLButtonElement, StepperButtonProps>(
  function StepperButton(
    {
      kind,
      children,
      className,
      style,
      onClick,
      onPointerDown,
      onPointerUp,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      onPointerCancel,
      onLostPointerCapture,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      disabled: authoredDisabled,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) {
      throw new Error(
        `Reference UI: NumberField.${kind === 'increment' ? 'Increment' : 'Decrement'} must be used inside <NumberField> — it has no behavior outside the field.`
      )
    }
    const groupScope = React.useContext(NumberFieldGroupContext)
    if (!groupScope) {
      throw new Error(
        `Reference UI: NumberField.${kind === 'increment' ? 'Increment' : 'Decrement'} must be a direct child of <NumberField.Group> — misplaced parts never join behavior.`
      )
    }

    // Managed authority (NF-TYPE-03, NF-DOM-06): behavior-owned props are
    // stripped so conflicting runtime casts cannot break the stepper.
    const {
      type: _managedType,
      tabIndex: _managedTabIndex,
      role: _managedRole,
      'aria-controls': _managedControls,
      'aria-disabled': _managedAriaDisabled,
      'aria-readonly': _managedAriaReadonly,
      'aria-required': _managedAriaRequired,
      'aria-checked': _managedAriaChecked,
      'aria-pressed': _managedAriaPressed,
      'aria-valuemin': _managedValueMin,
      'aria-valuemax': _managedValueMax,
      'aria-valuenow': _managedValueNow,
      'aria-valuetext': _managedValueText,
      'data-pressed': _managedPressed,
      ...restProps
    } = props as Record<string, unknown>

    // Capability follows controlled or complete dirty state, bounds, root
    // state, and authored disabled (NF-STEP-11). Structural type/tabIndex/
    // controls stay managed (NF-TYPE-03); the accessible name is required,
    // validated, and passed through explicitly.
    const base = context.stepBase ?? context.value
    const atBound =
      kind === 'increment'
        ? base !== null && context.max !== undefined && context.max !== Infinity && base >= context.max
        : base !== null && context.min !== undefined && context.min !== -Infinity && base <= context.min
    const isDisabled = context.disabled || context.readOnly || authoredDisabled || atBound || false

    // Internal button node for owner-root name resolution (NF-ENV-06),
    // merged with the forwarded ref below.
    const buttonRef = React.useRef<HTMLButtonElement | null>(null)
    const setButtonRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
      },
      [ref]
    )

    // Required-name gate (PATCHES §6): hooks run unconditionally so
    // named↔unnamed transitions never change the hook count; the null
    // return below is the "neither registers nor activates" branch.
    const named = useStepperName(
      kind === 'increment' ? 'Increment' : 'Decrement',
      ariaLabel,
      ariaLabelledby,
      buttonRef
    )

    // Named-part registration (NF-DOM-03): unnamed steppers render nothing
    // and never register, so they cannot join behavior.
    const registerPart = groupScope.registerPart
    useIsomorphicLayoutEffect(() => {
      if (!named) return
      return registerPart(kind)
    }, [named, registerPart, kind])

    // Press-and-hold stepping (PATCHES §7): consumer handlers chain first
    // inside the hook, so authored pointer props can never clobber the
    // session machine via the trailing spread.
    const repeat = useStepperRepeat({
      action: kind === 'increment' ? context.increment : context.decrement,
      focusInput: context.focusInput,
      disabled: isDisabled,
      atBound,
      resetEpoch: context.resetEpoch,
      replacementEpoch: context.replacementEpoch,
      user: {
        onClick,
        onPointerDown,
        onPointerUp,
        onPointerMove,
        onPointerEnter,
        onPointerLeave,
        onPointerCancel,
        onLostPointerCapture,
      },
    })

    if (!named) return null

    return (
      <Button
        ref={setButtonRef}
        type="button"
        tabIndex={-1}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-controls={context.inputId}
        disabled={isDisabled}
        data-disabled={isDisabled ? '' : undefined}
        data-pressed={repeat.pressed ? '' : undefined}
        onClick={repeat.handleClick}
        onPointerDown={repeat.handlePointerDown}
        onPointerUp={repeat.handlePointerUp}
        onPointerMove={repeat.handlePointerMove}
        onPointerEnter={repeat.handlePointerEnter}
        onPointerLeave={repeat.handlePointerLeave}
        onPointerCancel={repeat.handlePointerCancel}
        onLostPointerCapture={repeat.handleLostPointerCapture}
        height="100%"
        aspectRatio="1 / 1"
        p="0"
        m="0"
        border="none"
        bg="transparent"
        borderRadius="sm"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        color="design.text.base"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        outline="none"
        _hover={!isDisabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
        _active={!isDisabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={{
          aspectRatio: '1 / 1',
          height: '100%',
          margin: 0,
          ...style,
        }}
        {...restProps}
      >
        {children ?? <StepperIcon kind={kind} />}
      </Button>
    )
  }
)
