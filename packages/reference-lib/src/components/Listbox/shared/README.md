# shared

The nameless plumbing Listbox's guards and checks stand on: the predicate
that tells the option's own events apart from in-row interactive content
and portaled row content, and the dev-only warn channel with its production
gate. Nothing here knows about selection, focus, or combobox nesting — press,
click, and keydown handlers all ask the predicate first.

Up: Listbox.
