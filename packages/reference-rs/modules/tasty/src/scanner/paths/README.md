# Path normalization

Filesystem paths into stable ids. Converts paths to Unix-style file ids, symbol ids, module specifiers, and package names — deriving library names and name-plus-subpath splits — without ever touching the filesystem. It also reduces an import specifier to its path, dropping any `?query` or `#hash` suffix, so file lookups never see a bundler directive as part of a file name.
