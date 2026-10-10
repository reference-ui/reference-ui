/**
 * Combobox public API: the compound root, its parts, the development
 * diagnostic, and the shared vocabulary (autocomplete, adapters,
 * navigation) Listbox, Tree, and stories import. Re-exports only —
 * every behavior lives in the root, parts, hooks, and domain modules.
 */
export { Combobox } from './Combobox'
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
