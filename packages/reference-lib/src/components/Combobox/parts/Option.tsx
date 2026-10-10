/**
 * Combobox's option alias: the Listbox option row under the Combobox
 * compound name. No behavior of its own — selection, active state, and
 * commit authority all resolve through the nested Listbox and the
 * Combobox root it yields to.
 */
import { ListboxOption, type ListboxOptionProps } from '../../Listbox'

export function ComboboxOption(props: ListboxOptionProps) {
  return <ListboxOption {...props} />
}
