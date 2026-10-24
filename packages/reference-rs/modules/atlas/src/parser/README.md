# Atlas module parser

Top-level statements into per-file module info. Imports record here while components (PascalCase names with JSX-returning bodies, props from annotations or wrapper calls), exports in every form, and lowered type shapes each own a reader — sharing one file context and parse state.

A module is parsed once. For the app's own files (a parse with no package name), the same program also yields the file's JSX occurrences and module-scope names, stored on `ModuleInfo` for the usage and observe passes, so the nesting gate runs once per file. The module keeps no copy of its source text.
