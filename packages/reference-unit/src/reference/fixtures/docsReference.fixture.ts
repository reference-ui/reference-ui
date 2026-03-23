export const docsReferenceTheme = {
  spacing: {
    compact: 4,
    comfortable: 8,
    spacious: 12,
  },
  intents: {
    primary: 'blue',
    danger: 'red',
  },
} as const

export const docsReferenceSizeTokens = ['sm', 'md', 'lg'] as const

export type DocsReferenceSimpleType = 'a' | 'b'
export type DocsReferenceButtonVariant = 'solid' | 'ghost' | 'outline'
export type DocsReferenceButtonSize = 'sm' | 'md' | 'lg'
export type DocsReferenceIconName = 'plus' | 'minus' | 'chevron-down'
export type DocsReferenceButtonSpacing = typeof docsReferenceTheme.spacing
export type DocsReferenceButtonPadding = [inline: number, block: number]
export type DocsReferenceButtonIntent = keyof typeof docsReferenceTheme.intents
export type DocsReferenceResolvedSize = (typeof docsReferenceSizeTokens)[number]
export type DocsReferenceResolvedTone = `tone-${(typeof docsReferenceSizeTokens)[number]}`
export type DocsReferenceToneKey = `tone-${DocsReferenceButtonVariant}`
export type DocsReferenceSpacingPreview = {
  compact: 4
  comfortable: 8
  spacious: 12
}

export interface DocsReferencePressEvent {
  pointerType: 'mouse' | 'touch' | 'keyboard'
  shiftKey: boolean
}

export interface DocsReferenceButtonState {
  pressed: boolean
  loading: boolean
  intent: DocsReferenceButtonIntent
}

export interface DocsReferencePinnedTarget {
  label: string
  disabled?: boolean
}

export type DocsReferencePinnedTargetAlias = DocsReferencePinnedTarget

export type DocsReferenceTypeBaseProps = {
  /**
   * Shared label inherited from a first-class type.
   */
  label: string

  /**
   * Shared size inherited from a first-class type.
   */
  size?: DocsReferenceButtonSize

  /**
   * Shared tone inherited from a first-class type.
   */
  tone?: DocsReferenceButtonVariant
}

export interface DocsReferenceTypeExtendsProps extends DocsReferenceTypeBaseProps {
  /**
   * Local flag declared by the extending interface.
   */
  hasMenu?: boolean
}

export type DocsReferenceLargeTypeBaseProps = {
  tone?: DocsReferenceButtonVariant
  size?: DocsReferenceButtonSize
  prop01?: string
  prop02?: string
  prop03?: string
  prop04?: string
  prop05?: string
  prop06?: string
  prop07?: string
  prop08?: string
  prop09?: string
  prop10?: string
  prop11?: string
  prop12?: string
  prop13?: string
  prop14?: string
  prop15?: string
  prop16?: string
  prop17?: string
  prop18?: string
  prop19?: string
  prop20?: string
  prop21?: string
}

export interface DocsReferenceLargeTypeExtendsProps extends DocsReferenceLargeTypeBaseProps {
  /**
   * Local member that stays in the main section.
   */
  myCustomProps: string
}

export interface DocsReferenceControlBaseProps {
  /**
   * Stable id shared across composed controls.
   */
  controlId?: string
}

export interface DocsReferencePressableProps extends DocsReferenceControlBaseProps {
  /**
   * Accessibility role applied to the pressable surface.
   */
  interactionRole?: 'button' | 'menuitem'

  /**
   * Shared announcement label for assistive tech.
   */
  announceLabel?: string
}

/**
 * Generic async state used to exercise constraints and defaults in the header.
 */
export interface DocsReferenceAsyncState<TData extends string = DocsReferenceButtonVariant> {
  /**
   * Current lifecycle marker for the async workflow.
   */
  status: 'idle' | 'loading' | 'success'

  /**
   * Last resolved payload when the state is successful.
   */
  data?: TData
}

export type DocsReferenceToneLabels = {
  [K in DocsReferenceButtonVariant as `tone-${K}`]: K
}

export type DocsReferenceInteractiveElement =
  | {
      kind: 'action'
      onPress: () => void
      disabled?: boolean
    }
  | {
      kind: 'link'
      href: string
      target?: '_self' | '_blank'
    }

export type DocsReferenceVariantMeta<T extends string> = T extends 'solid'
  ? {
      emphasis: 'high'
      fill: true
    }
  : {
      emphasis: 'low'
      fill: false
    }

export type DocsReferenceButtonVariantMeta = DocsReferenceVariantMeta<DocsReferenceButtonVariant>
export type DocsReferenceComposedButtonProps = DocsReferenceButtonProps & DocsReferencePressableProps

/**
 * Public button props used to exercise the live reference table.
 *
 * This example intentionally mixes literals, aliases, callbacks, tuples, type
 * queries, indexed access, mapped types, and conditional types so we can see
 * what the current reference browser handles well.
 */
export interface DocsReferenceButtonProps {
  /**
   * Visible text shown inside the button.
   */
  label: string

  /**
   * Disables pointer and keyboard interaction.
   */
  disabled?: boolean

  /**
   * Visual treatment for the button shell.
   *
   * @default "solid"
   */
  variant?: DocsReferenceButtonVariant

  /**
   * Size preset applied to spacing and icon scale.
   *
   * @default "md"
   */
  size?: DocsReferenceButtonSize

  /**
   * Optional icon rendered next to the label.
   */
  icon?: DocsReferenceIconName

  /**
   * Placement for the optional icon.
   *
   * @default "start"
   */
  iconPosition?: 'start' | 'end'

  /**
   * Explicit inline and block padding override.
   */
  padding?: DocsReferenceButtonPadding

  /**
   * Theme spacing token source used by the component.
   */
  spacingScale?: DocsReferenceButtonSpacing

  /**
   * Current visual intent pulled from the state model.
   */
  currentIntent?: DocsReferenceButtonState['intent']

  /**
   * Size token derived from a readonly tuple source.
   */
  resolvedSize?: DocsReferenceResolvedSize

  /**
   * Labels keyed by the generated tone name.
   */
  toneLabels?: DocsReferenceToneLabels

  /**
   * Generated tone key label.
   */
  toneKey?: DocsReferenceToneKey

  /**
   * Tone label derived from a readonly tuple source.
   */
  resolvedTone?: DocsReferenceResolvedTone

  /**
   * Expanded object preview for spacing tokens.
   */
  spacingPreview?: DocsReferenceSpacingPreview

  /**
   * Conditional metadata derived from the current variant.
   */
  variantMeta?: DocsReferenceButtonVariantMeta

  /**
   * Called when the button is pressed.
   *
   * @param event - Pointer event metadata from the trigger interaction.
   * @param state - Snapshot of the button state at click time.
   */
  onPress?: (event: DocsReferencePressEvent, state: DocsReferenceButtonState) => void

  /**
   * Render override for the icon slot.
   *
   * @param icon - Icon name that would be rendered by default.
   * @param size - Resolved button size.
   * @returns Rendered icon markup.
   * @see icon
   * @example renderIcon('plus', 'md')
   */
  renderIcon?: (icon: DocsReferenceIconName, size: DocsReferenceButtonSize) => string

  /**
   * Optional formatter for the visible label.
   *
   * @param value - Current label text.
   * @deprecated Prefer a direct render override.
   * @remarks Useful for exercising non-param JSDoc tags in the browser.
   */
  formatLabel?: (value: string) => string
}

export type DocsReferenceCurrentIntent = DocsReferenceButtonProps['currentIntent']

/**
 * Split button props used to exercise inherited member origin tracking.
 */
export interface DocsReferenceSplitButtonProps
  extends DocsReferenceButtonProps,
    DocsReferencePressableProps {
  /**
   * Whether the trailing action opens a menu.
   */
  hasMenu?: boolean

  /**
   * Size preset reapplied for split-button affordances.
   *
   * @default "lg"
   */
  size?: DocsReferenceButtonSize
}
