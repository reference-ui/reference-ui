/**
 * Defaults fixture: the member-row details that replace a hand-written
 * prop table. Declares a boolean with `@default false`, a ReactNode with a
 * prose default, a literal union with a default, a callback whose param is
 * undocumented, and a description with `backtick` code spans.
 */
import type * as React from 'react'
import { Reference } from '../index'

/**
 * Collapsible root props. Open state follows `open` when set, and `defaultOpen` otherwise.
 */
export interface DocsReferenceDefaultsProps {
  /**
   * Whether the content is hidden from interaction.
   *
   * @default false
   */
  disabled?: boolean

  /**
   * Icon shown beside the trigger label. Pass `null` to hide it.
   *
   * @default a chevron icon
   */
  icon?: React.ReactNode

  /**
   * Which side the panel opens toward.
   *
   * @default "bottom"
   */
  side?: 'top' | 'bottom' | 'start' | 'end'

  /**
   * Number of items kept mounted while closed.
   *
   * @default 0
   */
  keepMounted?: number

  /**
   * Whether the control is disabled, inheriting from the group.
   *
   * @default the root's `disabled`
   */
  inheritDisabled?: boolean

  /**
   * Called when the open state changes.
   *
   * @param open
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Called before a change is committed. Return `false` to cancel it.
   *
   * @param next - The open state about to be applied.
   * @param reason
   */
  onBeforeChange?: (next: boolean, reason: string) => boolean
}

export default <Reference name="DocsReferenceDefaultsProps" />
