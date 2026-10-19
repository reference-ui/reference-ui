/**
 * Listbox's root: the listbox container and compound assembly. It yields
 * commit authority to a containing Combobox, composes the session,
 * registry, focus, selection, navigation, and typeahead hooks plus the
 * unmatched-value warning, provides the option scope, and renders the
 * container Div. All decisions live in
 * the hooks and domain folders; this file ends in the public compound
 * assignment (Option, Section, Header, Empty).
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { ComboboxContext } from '../Combobox/combobox-context'
import { ListboxContext } from './context'
import {
  useListboxNavigation,
  useListboxSelection,
  useListboxSession,
  useListboxTypeahead,
  useOptionRegistry,
  useRovingFocus,
  useUnmatchedValueWarning,
} from './hooks'
import { ListboxOption } from './parts/Option'
import { ListboxEmpty, ListboxHeader, ListboxSection } from './parts/Section'
import type { ListboxContextValue, ListboxProps } from './types'

// The omitted multiple value: one frozen empty selection shared by every render.
// A fresh [] per render changes the context value identity, so each Listbox
// update re-registers its options and schedules another update, never settling.
const EMPTY_MULTIPLE_VALUE: string[] = Object.freeze([] as string[]) as string[]

export const ListboxComponentBase = React.forwardRef<HTMLDivElement, ListboxProps>(
  function Listbox(
    {
      children,
      selection = 'single',
      value: valueProp,
      onChange,
      orientation = 'vertical',
      virtual,
      disabled = false,
      tabIndex: tabIndexProp,
      className,
      style,
      ...props
    },
    ref
  ) {
    const combobox = React.useContext(ComboboxContext)

    // LB-CB-03: Yield commit authority to containing Combobox
    if (combobox && onChange) {
      throw new Error(
        'Reference UI: Listbox cannot have an onChange handler when used inside Combobox. Combobox owns selection authority.'
      )
    }

    const controlledValue = combobox
      ? combobox.value
      : valueProp !== undefined
        ? valueProp
        : selection === 'multiple'
          ? EMPTY_MULTIPLE_VALUE
          : null

    const session = useListboxSession(valueProp)
    const { registerOption, registerRenderValue, getOrderedOptions, optionsCount } =
      useOptionRegistry(session, virtual)
    const preferredTabValue = useRovingFocus(
      session,
      getOrderedOptions,
      session.optionsVersion,
      selection,
      controlledValue,
      virtual
    )
    const { isOptionSelected, selectOption } = useListboxSelection(
      selection,
      controlledValue,
      combobox,
      onChange,
      virtual,
      getOrderedOptions
    )
    // Combobox owns the value when nested (controlledValue is combobox.value), so
    // only a standalone controlled Listbox can be unmatched in its own right.
    useUnmatchedValueWarning({
      selection,
      value: controlledValue,
      isControlled: !combobox && valueProp !== undefined,
      items: virtual?.items,
      getOrderedOptions,
      registryVersion: session.optionsVersion,
    })
    const { navigateVirtual, navigateStandalone } = useListboxNavigation(
      session,
      orientation,
      virtual
    )
    const { typeaheadHasBuffer, handleStandaloneTypeahead, handleVirtualTypeahead } =
      useListboxTypeahead(session, getOrderedOptions, virtual)
    const { focusedValue, setFocusedValue, pendingVirtualIndex, setPendingVirtualIndex } = session

    const contextValue = React.useMemo<ListboxContextValue>(
      () => ({
        selection,
        orientation,
        value: controlledValue,
        disabled,
        isOptionSelected,
        selectOption,
        virtual,
        focusedValue,
        setFocusedValue,
        preferredTabValue,
        registerOption,
        registerRenderValue,
        getOrderedOptions,
        typeaheadHasBuffer,
        handleStandaloneTypeahead,
        handleVirtualTypeahead,
        pendingVirtualIndex,
        setPendingVirtualIndex,
        navigateVirtual,
        navigateStandalone,
      }),
      [
        selection,
        orientation,
        controlledValue,
        disabled,
        isOptionSelected,
        selectOption,
        virtual,
        combobox,
        focusedValue,
        preferredTabValue,
        registerOption,
        registerRenderValue,
        getOrderedOptions,
        typeaheadHasBuffer,
        handleStandaloneTypeahead,
        handleVirtualTypeahead,
        pendingVirtualIndex,
        navigateVirtual,
        navigateStandalone,
      ]
    )

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      props.onMouseLeave?.(e)
      if (combobox) {
        combobox.setActiveValue(combobox.value ?? null)
      }
    }

    const composedRef = (node: HTMLDivElement | null) => {
      session.containerRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    }

    // Determine root tabIndex (LB-DOM-07)
    const rootTabIndex = optionsCount === 0 ? tabIndexProp : undefined

    return (
      <ListboxContext.Provider value={contextValue}>
        <Div
          ref={composedRef}
          role="listbox"
          aria-orientation={orientation}
          aria-multiselectable={selection === 'multiple' ? 'true' : undefined}
          data-orientation={orientation}
          data-reference-listbox=""
          data-disabled={disabled ? '' : undefined}
          tabIndex={rootTabIndex}
          display="flex"
          flexDirection={orientation === 'vertical' ? 'column' : 'row'}
          gap="0.5r"
          outline="none"
          onMouseLeave={handleMouseLeave}
          onPointerLeave={handleMouseLeave}
          p={combobox ? '0' : '1r'}
          bg={combobox ? 'transparent' : 'ui.dialog.background'}
          color={combobox ? 'inherit' : 'ui.dialog.foreground'}
          borderRadius={combobox ? undefined : 'md'}
          border={combobox ? undefined : '1px solid'}
          borderColor={combobox ? undefined : 'ui.dialog.border'}
          boxShadow={combobox ? undefined : '0 4px 16px rgba(0,0,0,0.12)'}
          className={className}
          style={style}
          {...props}
        >
          {children}
        </Div>
      </ListboxContext.Provider>
    )
  }
)

export type ListboxComponent = {
  <TValue extends string = string>(
    props: ListboxProps<TValue> & React.RefAttributes<HTMLDivElement>
  ): React.ReactElement | null
  Option: typeof ListboxOption
  Section: typeof ListboxSection
  Header: typeof ListboxHeader
  Empty: typeof ListboxEmpty
}

// Public generic face over the string-typed forwardRef implementation:
// TValue infers per use site (literals narrow, default string); internals
// erase to string since TValue extends string. Runtime untouched.
export const Listbox = ListboxComponentBase as unknown as ListboxComponent
Listbox.Option = ListboxOption
Listbox.Section = ListboxSection
Listbox.Header = ListboxHeader
Listbox.Empty = ListboxEmpty
