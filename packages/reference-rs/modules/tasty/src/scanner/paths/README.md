# Path normalization

Filesystem paths into stable ids. Converts paths to Unix-style file ids, symbol ids, module specifiers, and package names — deriving library names and name-plus-subpath splits — without ever touching the filesystem. It also reads the path of an import specifier from before any `?query` or `#hash` suffix, the path the on-disk check uses.
