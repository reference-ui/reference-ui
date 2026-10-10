/**
 * NumberField.Increment: the step-up button. A thin named wrapper over
 * the shared stepper engine — the kind stays a distinct exported part
 * so the Group's direct-anatomy scan and compound assignment keep their
 * identities, while every behavior lives in the base.
 */
import * as React from 'react'
import type { NumberFieldIncrementProps } from '../types'
import { StepperButton } from './StepperButton'

export const NumberFieldIncrement = React.forwardRef<HTMLButtonElement, NumberFieldIncrementProps>(
  function NumberFieldIncrement(props, ref) {
    return <StepperButton {...props} kind="increment" ref={ref} />
  }
)
