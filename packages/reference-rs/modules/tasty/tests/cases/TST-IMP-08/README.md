# TST-IMP-08 — A relative ?raw or #hash import resolves its file: no TST-W-UNRESOLVED-IMPORT

Verifies that `./notes.md?raw` and `./notes.md#usage` name the sibling `notes.md`, which exists.
Bundlers read a `?raw` query and a `#hash` as directives on the file the path names, so the file lookup
must see only the path before the first `?` or `#`.
Verifies that neither import raises a `TST-W-UNRESOLVED-IMPORT` warning, and that the module holding them still
emits its user-owned symbol.
Proves primary SPEC ID anchor TST-IMP-08.
