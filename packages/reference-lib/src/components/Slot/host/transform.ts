/**
 * `transformSlotElements` lets a host decorate registered elements: each
 * slot element is cloned with its original props intact plus host-supplied
 * props from `createProps`, which win on collision. The registry keeps the
 * pristine element; the transformed clones belong to the host render.
 */
import * as React from 'react'
import type { SlotRegistration } from '../types'

export function transformSlotElements<TProps extends Record<string, unknown>>(
  slots: SlotRegistration[],
  createProps: (slot: SlotRegistration) => TProps
): Array<React.ReactElement<TProps>> {
  return slots.map(slot => {
    const extraProps = createProps(slot)
    const originalProps = (slot.element.props && typeof slot.element.props === 'object'
      ? slot.element.props
      : {}) as Record<string, unknown>
    return React.cloneElement(slot.element, {
      ...originalProps,
      ...extraProps,
    } as any) as unknown as React.ReactElement<TProps>
  })
}
