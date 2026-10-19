/**
 * Calendar hooks: pane, availability, out-of-range warning, selection,
 * today, locale, and grid focus. Re-exports the bindings the root
 * resolves in order; no logic lives here.
 */
export { usePane } from './use-pane'
export type { PaneOptions } from './use-pane'
export { useAvailability } from './use-availability'
export type { AvailabilityOptions } from './use-availability'
export { useOutOfRangeWarning } from './use-out-of-range'
export type { OutOfRangeOptions } from './use-out-of-range'
export { useSelection } from './use-selection'
export type { SelectionOptions, CalendarEmitter } from './use-selection'
export { useTodayMarker } from './use-today-marker'
export { useLocaleData } from './use-locale-data'
export type { LocaleDataOptions } from './use-locale-data'
export { useGridFocus } from './use-grid-focus'
export type { GridFocusOptions } from './use-grid-focus'
