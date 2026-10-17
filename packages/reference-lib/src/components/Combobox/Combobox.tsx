/**
 * Combobox's root: the controlled combobox coordinator and compound
 * assembly. It enforces the controlled-only contract, composes the
 * session, registry, authority, active, open, virtual, bridge, source,
 * text, commit, resolver, and announcement hooks, provides the nested
 * scope, and renders the Overlay shell. All decisions live in the hooks
 * and domain modules; this file ends in the public compound assignment
 * (Input, Trigger, Popover, Option, VirtualItem, Section, Empty).
 */
import * as React from 'react'
import { Listbox, ListboxEmpty, ListboxOption, ListboxSection } from '../Listbox'
import { Tree, TreeItem } from '../Tree'
import { Overlay } from '../Overlay'
import { isDevelopment } from '../../core/env/dev'
import {
  ComboboxContext,
  type ComboboxContextValue,
} from './combobox-context'
import {
  useAuthoredAuthority,
  useComboboxActive,
  useComboboxAnnouncements,
  useComboboxCommits,
  useComboboxOpen,
  useComboboxRegistry,
  useComboboxSession,
  useComboboxText,
  useOpenResolver,
  useSourceRegistration,
  useTreeBridge,
  useVirtualCells,
  useVirtualCore,
} from './hooks'
import { ComboboxInput } from './parts/Input'
import { ComboboxOption } from './parts/Option'
import { ComboboxPopover } from './parts/Popover'
import { ComboboxTrigger } from './parts/Trigger'
import { ComboboxVirtualItem } from './parts/VirtualItem'
import type { ComboboxProps } from './types'

// Historical `./Combobox` surface: parts, diagnostic, and vocabulary
// re-exported so deep imports (tests) keep resolving to the real parts.
export { ComboboxInput } from './parts/Input'
export { ComboboxTrigger } from './parts/Trigger'
export { ComboboxPopover } from './parts/Popover'
export { ComboboxOption } from './parts/Option'
export { ComboboxVirtualItem } from './parts/VirtualItem'
export { comboboxDiagnostic } from './shared/diagnostic'
export type {
  ComboboxAutocomplete,
  ComboboxGridAdapter,
  ComboboxTreeExpansionRequest,
  VirtualFocusNavigationKey,
  VirtualFocusNavigationRequest,
} from './combobox-context'
export type { VirtualFocusItem } from '../Listbox'
export type {
  ComboboxInputProps,
  ComboboxPopoverProps,
  ComboboxProps,
  ComboboxTriggerProps,
  ComboboxVirtualItemProps,
} from './types'

export function Combobox({
  children,
  value,
  onChange,
  inputValue: inputValProp,
  defaultInputValue,
  onInputValueChange,
  onInputChange,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onDismiss,
  onOpenChange,
  disabled = false,
  closeOnBlur = true,
  autocomplete = 'list',
  allowCustomValue = false,
  onEscape,
  loading = false,
  emptyMessage = 'No options available',
  noResultsMessage = 'No results found',
}: ComboboxProps) {
  // Controlled-only: value + onChange are required; there is no uncontrolled branch.
  if (isDevelopment()) {
    if (value === undefined) {
      const err =
        '[reference-ui] Combobox: Missing required "value" prop. Combobox is controlled-only: pass value + onChange.'
      console.error(err)
      throw new Error(err)
    }
    if (onChange === undefined) {
      const err =
        '[reference-ui] Combobox: Missing required "onChange" prop. Combobox is controlled-only: pass value + onChange.'
      console.error(err)
      throw new Error(err)
    }
  }

  const session = useComboboxSession(value, inputValProp, defaultInputValue, openProp, defaultOpen)
  const { registerOption, getOrderedOptions } = useComboboxRegistry(session)
  const {
    authoredScan,
    hasPopoverContent,
    virtualAdapter,
    windowedListAdapter,
    popupRole,
    collectionConflict,
  } = useAuthoredAuthority(session, children, onChange, {
    Popover: ComboboxPopover,
    ComboboxOption,
    ListboxOption,
    VirtualItem: ComboboxVirtualItem,
    Listbox,
    Tree,
    TreeItem,
    Empty: ListboxEmpty,
  })
  const { setActiveValue, clearPointerActive } = useComboboxActive(
    session,
    value,
    collectionConflict
  )
  const { setIsOpen, requestArrowOpen } = useComboboxOpen(session, {
    onOpen,
    onOpenChange,
    onDismiss,
  })
  const { requestVirtualIndex, navigateVirtual, searchVirtual } = useVirtualCore(
    session,
    setActiveValue
  )
  const { treeExpansionRequest, requestTreeExpansion } = useTreeBridge(
    collectionConflict,
    session.isOpen,
    popupRole
  )
  const { selectOnly, registerFocusSource, registerPopover } = useSourceRegistration(session)

  const notifyInput = onInputValueChange ?? onInputChange
  const { handleInputChange, revertToCommittedText, resolveUnmatchedText } = useComboboxText(
    session,
    {
      value,
      onChange,
      notifyInput,
      selectOnly,
      allowCustomValue,
      collectionConflict,
      getOrderedOptions,
      setActiveValue,
      searchVirtual,
    }
  )
  const { handleSelect, handleOutsidePress, handleSourceBlur } = useComboboxCommits(session, {
    value,
    onChange,
    closeOnBlur,
    selectOnly,
    collectionConflict,
    setIsOpen,
    handleInputChange,
    resolveUnmatchedText,
  })
  const { registerVirtualItem, previewVirtualItem, commitVirtualItem } = useVirtualCells(
    session,
    setActiveValue,
    handleSelect
  )
  useOpenResolver(session, {
    value,
    inputValue: session.inputValue,
    collectionConflict,
    getOrderedOptions,
    requestVirtualIndex,
    searchVirtual,
  })
  useComboboxAnnouncements(session, {
    loading,
    popupRole,
    hasPopoverContent,
    emptyAuthored: authoredScan.emptyAuthored,
    selectOnly,
    emptyMessage,
    noResultsMessage,
  })

  const {
    inputValue,
    isOpen,
    activeValue,
    activeSource,
    optionsMapRef,
    pendingVirtualIndex,
    popoverId,
  } = session

  // Selection-following (CB-NAV-02, CB-SELECT-07): the committed value
  // refines the active descendant only when it names a registered,
  // enabled option. A disabled or absent selection never becomes active —
  // every open path then falls to its directional/positional default.
  const committedEntry = value != null ? optionsMapRef.current.get(value) : undefined
  const committedFollowable = committedEntry != null && !committedEntry.disabled
  const effectiveActive = activeValue ?? (isOpen && committedFollowable ? value : null)
  const activeOption = effectiveActive ? optionsMapRef.current.get(effectiveActive) : null
  const activeOptionId =
    activeOption && activeOption.node && activeOption.node.isConnected
      ? activeOption.id
      : null
  const activeOptionText =
    activeOption && activeOption.node && activeOption.node.isConnected
      ? (activeOption.textValue ?? activeOption.value)
      : null

  const contextValue = React.useMemo<ComboboxContextValue>(
    () => ({
      value,
      inputValue,
      isOpen,
      disabled,
      selectOnly,
      closeOnBlur,
      autocomplete,
      allowCustomValue,
      onEscape,
      hasPopoverContent,
      virtualAdapter,
      windowedListAdapter,
      pendingVirtualIndex,
      treeExpansionRequest,
      requestTreeExpansion,
      loading,
      navigateVirtual,
      searchVirtual,
      requestVirtualIndex,
      registerVirtualItem,
      previewVirtualItem,
      commitVirtualItem,
      popupRole,
      collectionConflict,
      setIsOpen,
      requestArrowOpen,
      handleSelect,
      handleInputChange,
      handleSourceBlur,
      sourceRef: session.sourceRef,
      activeValue,
      activeSource,
      setActiveValue,
      clearPointerActive,
      activeOptionId,
      activeOptionText,
      registerOption,
      getOrderedOptions,
      popoverId,
      registerFocusSource,
      registerPopover,
      revertToCommittedText,
      resolveUnmatchedText,
    }),
    [
      value,
      inputValue,
      isOpen,
      disabled,
      selectOnly,
      closeOnBlur,
      autocomplete,
      allowCustomValue,
      onEscape,
      hasPopoverContent,
      virtualAdapter,
      windowedListAdapter,
      pendingVirtualIndex,
      treeExpansionRequest,
      requestTreeExpansion,
      loading,
      navigateVirtual,
      searchVirtual,
      requestVirtualIndex,
      registerVirtualItem,
      previewVirtualItem,
      commitVirtualItem,
      popupRole,
      collectionConflict,
      setIsOpen,
      requestArrowOpen,
      handleSelect,
      handleInputChange,
      handleSourceBlur,
      activeValue,
      activeSource,
      setActiveValue,
      clearPointerActive,
      activeOptionId,
      activeOptionText,
      registerOption,
      getOrderedOptions,
      popoverId,
      registerFocusSource,
      registerPopover,
      revertToCommittedText,
      resolveUnmatchedText,
    ]
  )

  return (
    <ComboboxContext.Provider value={contextValue}>
      <Overlay
        open={isOpen}
        onOutsidePress={handleOutsidePress}
        onDismiss={() => setIsOpen(false)}
        isolation={false}
        closeOnScroll
        anchor={session.sourceRef}
      >
        {children}
      </Overlay>
    </ComboboxContext.Provider>
  )
}

Combobox.Input = ComboboxInput
Combobox.Trigger = ComboboxTrigger
Combobox.Popover = ComboboxPopover
Combobox.Option = ComboboxOption
Combobox.VirtualItem = ComboboxVirtualItem
Combobox.Section = ListboxSection
Combobox.Empty = ListboxEmpty
