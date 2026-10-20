# selection

How Listbox commits multi-select toggles: known values resolve in
collection order while unknown values (selected but not mounted) append
after. A pure reducer — the selection hook calls it and hands the
result to onChange.
