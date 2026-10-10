/**
 * NumberField.Decrement: the step-down button. A thin named wrapper over
 * the shared stepper engine — the kind stays a distinct exported part
 * so the Group's direct-anatomy scan and compound assignment keep their
 * identities, while every behavior lives in the base.
 */
import * as React from 'react'
import type { NumberFieldDecrementProps } from '../types'
import { StepperButton } from './StepperButton'

export const NumberFieldDecrement = React.forwardRef<HTMLButtonElement, NumberFieldDecrementProps>(
  function NumberFieldDecrement(props, ref) {
    return <StepperButton {...props} kind="decrement" ref={ref} />
  }
)
