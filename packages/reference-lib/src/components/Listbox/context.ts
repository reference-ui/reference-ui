/**
 * Listbox's private subtree scope: the context object options read for
 * selection, focus, registration, typeahead, and navigation. The value
 * shape lives in types.ts; the root provides it. Options also read the
 * Combobox context directly when nested, which is why this scope stays
 * nullable instead of throwing outside a provider.
 */
import * as React from 'react'
import type { ListboxContextValue } from './types'

export const ListboxContext = React.createContext<ListboxContextValue | null>(null)
