/**
 * Listbox public API: the compound root plus the selection and
 * virtualization helpers tests and virtualized consumers import.
 * Re-exports only — every behavior lives in the root, parts, hooks,
 * and domain folders.
 */
export { Listbox, ListboxComponentBase } from './Listbox'
export type { ListboxComponent } from './Listbox'
export { ListboxOption } from './parts/Option'
export { ListboxEmpty, ListboxHeader, ListboxSection } from './parts/Section'
export { computeNextMultipleSelection } from './selection/multiple'
export { validateVirtualAdapter } from './virtual/adapter'
export type {
  ListboxEmptyProps,
  ListboxHeaderProps,
  ListboxMultipleProps,
  ListboxOptionComponent,
  ListboxOptionProps,
  ListboxOrientation,
  ListboxProps,
  ListboxSectionProps,
  ListboxSelection,
  ListboxSingleProps,
  ListboxValue,
  ListboxVirtualAdapter,
  OptionRecord,
  VirtualFocusAdapter,
  VirtualFocusItem,
} from './types'
