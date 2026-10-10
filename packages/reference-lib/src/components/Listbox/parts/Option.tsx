/**
 * Listbox's option part: one selectable row. It reads listbox and combobox
 * scope, computes selection/active/tab-stop presentation, wires
 * registration, press, and keyboard hooks, and renders the styled row —
 * with a check slot when nested in a combobox. All interaction decisions
 * live in the hooks; this file composes them over the Div.
 */
import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { CheckIcon } from '@reference-ui/icons'
import { ComboboxContext } from '../../Combobox/combobox-context'
import { controlSize, controlHeightPx } from '../../../core/theme/primitives/shared'
import { ListboxContext } from '../context'
import {
  useOptionKeyboard,
  useOptionPress,
  useOptionRegistration,
} from '../hooks'
import type { ListboxOptionComponent, ListboxOptionProps } from '../types'

// String-typed forwardRef implementation (LB-DOM-05: the option ref promise
// holds on React 17/18 too, where ref-as-prop does not exist). The public
// generic face follows the same cast pattern as ListboxComponentBase.
const ListboxOptionBase = React.forwardRef<HTMLDivElement, ListboxOptionProps>(
  function ListboxOption(
    {
      value,
      disabled = false,
      textValue,
      index,
      children,
      onClick,
      onKeyDown,
      onKeyDownCapture,
      onPointerDown,
      onMouseDown,
      onPointerEnter,
      onFocus,
      className,
      style,
      id: idProp,
      ...props
    }: ListboxOptionProps,
    forwardedRef
  ) {
  const context = React.useContext(ListboxContext)
  const combobox = React.useContext(ComboboxContext)
  const optionRef = React.useRef<HTMLDivElement | null>(null)
  const optionId = idProp ?? `ref-opt-${value}`

  const composedOptionRef = (node: HTMLDivElement | null) => {
    optionRef.current = node
    if (typeof forwardedRef === 'function') {
      forwardedRef(node)
    } else if (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef) {
      ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }

  const isDisabled = disabled || (context?.disabled ?? false)
  const isSelected = context
    ? context.isOptionSelected(value)
    : combobox
      ? combobox.value === value
      : false

  useOptionRegistration({
    context,
    combobox,
    value,
    optionId,
    index,
    isDisabled,
    textValue,
    children,
    optionRef,
  })

  const isActiveInCombobox = combobox
    ? combobox.activeOptionId === optionId ||
      (combobox.activeValue === value &&
        (!combobox.activeOptionId || combobox.activeOptionId === optionId))
    : false

  const isActive = combobox ? isActiveInCombobox : isSelected

  // Tab stop computation
  let tabIndex = -1
  if (isDisabled || combobox) {
    tabIndex = -1
  } else if (context) {
    const activeVal = context.focusedValue ?? context.preferredTabValue
    tabIndex = activeVal === value ? 0 : -1
  }

  const { handlePointerDown, handleMouseDown, handlePointerEnter, handleClick } = useOptionPress({
    context,
    combobox,
    value,
    isDisabled,
    onClick,
    onPointerDown,
    onMouseDown,
    onPointerEnter,
  })

  const { handleKeyDownCapture, handleKeyDown, handleFocus } = useOptionKeyboard({
    context,
    combobox,
    value,
    index,
    isDisabled,
    optionRef,
    onKeyDown,
    onKeyDownCapture,
    onFocus,
  })

  return (
    <Div
      ref={composedOptionRef}
      id={optionId}
      role="option"
      tabIndex={tabIndex}
      aria-selected={isSelected ? 'true' : 'false'}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-setsize={context?.virtual ? context.virtual.items.length : undefined}
      aria-posinset={context?.virtual && index != null ? index + 1 : undefined}
      data-state={isSelected ? 'selected' : 'unselected'}
      data-selected={isSelected ? '' : undefined}
      data-active={combobox ? (isActiveInCombobox ? '' : undefined) : isActive ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-value={value}
      onMouseDown={handleMouseDown}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerOver={handlePointerEnter}
      onMouseEnter={handlePointerEnter}
      onClick={handleClick}
      onKeyDownCapture={handleKeyDownCapture}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      display="flex"
      alignItems="center"
      justifyContent={combobox ? 'space-between' : undefined}
      minHeight={controlSize.height}
      height="auto"
      px="3r"
      py={controlSize.paddingBlock}
      boxSizing="border-box"
      borderRadius="sm"
      fontSize="3.5r"
      lineHeight="5r"
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      /* B-38: standalone selection uses the muted wash (Menu/Tree parity;
         ui.button.background renders near-white in dark mode). Combobox
         active-highlight keeps the paired button tokens (transient). */
      bg={
        isActive
          ? combobox
            ? 'ui.button.background'
            : 'ui.table.row.mutedBackground'
          : 'transparent'
      }
      color={
        isActive
          ? combobox
            ? 'ui.button.foreground'
            : 'design.text.base'
          : 'design.text.base'
      }
      opacity={isDisabled ? 0.5 : 1}
      outline="none"
      userSelect="none"
      _hover={
        combobox
          ? undefined
          : !isSelected && !isDisabled
            ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' }
            : undefined
      }
      _focus={
        combobox
          ? { outline: 'none', bg: 'ui.button.background', color: 'ui.button.foreground' }
          : undefined
      }
      _focusVisible={
        combobox
          ? { outline: 'none', bg: 'ui.button.background', color: 'ui.button.foreground' }
          : { outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '-2px' }
      }
      css={{
        '& .ref-span': {
          color: 'inherit',
        },
        '& [data-slot="check"], & [data-slot="check"] *': {
          color: 'inherit',
          fill: 'currentColor',
        },
        '& [data-slot="description"]': {
          opacity: isActive ? 0.75 : 0.65,
          fontSize: '3r',
          lineHeight: '4r',
        },
      }}
      className={className}
      style={{
        minHeight: controlHeightPx,
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {combobox ? (
        <>
          <Span
            flex="1"
            display="inline-flex"
            alignItems="center"
            minWidth="0"
            textAlign="start"
            color="inherit"
          >
            {children}
          </Span>
          {isSelected && (
            <Span
              data-slot="check"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              width="4r"
              height="4r"
              flexShrink={0}
              color="inherit"
            >
              <CheckIcon />
            </Span>
          )}
        </>
      ) : (
        children
      )}
    </Div>
  )
  }
)

// Public generic face over the string-typed forwardRef implementation.
export const ListboxOption: ListboxOptionComponent =
  ListboxOptionBase as unknown as ListboxOptionComponent
