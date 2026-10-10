/**
 * The static seed for the direct-authored thumb shape only: answers whether
 * the root's children already hold a SwitchThumb by reference identity — no
 * displayName read, no fragment penetration. Seeds initial state so the first
 * paint (including SSR) is already correct; Fragment-wrapped and
 * HOC-forwarded thumbs are reconciled from rendered DOM structure instead.
 */
import * as React from 'react'
import { SwitchThumb } from '../parts/Thumb'

export function hasDirectAuthoredThumb(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some(
    child => React.isValidElement(child) && child.type === SwitchThumb
  )
}
