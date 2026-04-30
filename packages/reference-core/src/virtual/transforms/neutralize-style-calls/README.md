# Neutralize Style Calls

This transform hides direct `css()` and `cva()` calls outside the reserved style collection.

It is intentionally a higher-level wrapper over the native `replace_function_name` virtualrs transform: core uses that lower-level call rewrite twice, once for `css()` and once for normalized `cva()` calls.

The native transform is import-aware here: it only rewrites calls backed by the canonical `src/system/css` import, and when it does rewrite those calls it inserts the matching local alias binding after the import block. That keeps runtime behavior intact without leaving the brittle import/alias bookkeeping in JS.

`recipe()` flows through this path too, but indirectly: `rewriteCvaImports` normalizes recipe authoring to canonical `cva()` calls before neutralization runs.

It exists so Panda extracts from `virtual/__reference__ui` only, while the normal user virtual mirror stays runtime-correct but no longer exposes duplicate Panda-visible call sites.