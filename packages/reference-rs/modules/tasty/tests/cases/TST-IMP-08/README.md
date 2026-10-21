# TST-IMP-08 — A ?raw or #hash import finds its file and stays opaque: no TST-W-UNRESOLVED-IMPORT

Verifies that `./notes.md?raw` and `./notes.md#usage` name the sibling `notes.md`, which exists.
Bundlers read a `?raw` query and a `#hash` as directives on the file the path names, so the on-disk check
must see only the path before the first `?` or `#`.
Verifies that neither import raises a `TST-W-UNRESOLVED-IMPORT` warning.
Verifies that a suffixed import is opaque: `import src from './helper.ts?raw'` keeps `src` as an external
reference that names the specifier, and does not bind to the default export of `helper.ts`.
Proves primary SPEC ID anchor TST-IMP-08.
