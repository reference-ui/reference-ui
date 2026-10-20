# hooks

Listbox behavior as composable hooks over one session. The session owns
every ref and state cell; the registry owns option identity and DOM
order; roving focus owns the tab stop and focus recovery; selection,
navigation, and typeahead own their commits; the value warning names an
unmatched controlled value in dev; and the three option hooks wire one
row's registration, press, and keyboard handling. Effects run in
their original order — reset, revalidate, recover — and every pure
decision the hooks wrap lives in a tested domain module.
