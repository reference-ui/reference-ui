# Package resolution

Imports into files across installed and relative shapes. Discovers installed packages including scoped names; resolves entrypoints preferring type-exposing entries with conservative export-map reading; joins relative specifiers onto importers and probes exact files before appending extensions across dotted basenames. A `?query` or `#hash` suffix is dropped before either lookup, so `./notes.md?raw` names the file `notes.md`.
