# Package resolution

Imports into files across installed and relative shapes. Discovers installed packages including scoped names; resolves entrypoints preferring type-exposing entries with conservative export-map reading; joins relative specifiers onto importers and probes exact files before appending extensions across dotted basenames. A `?query` or `#hash` suffix makes an import opaque: it resolves to no module, so its bindings stay external. The dangling-import check still reads the path, so `./notes.md?raw` is not reported when `notes.md` exists.
