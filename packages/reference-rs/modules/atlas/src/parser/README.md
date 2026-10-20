# Atlas module parser

Top-level statements into per-file module info. Imports record here while components (PascalCase names with JSX-returning bodies, props from annotations or wrapper calls), exports in every form, and lowered type shapes each own a reader — sharing one file context and parse state.
