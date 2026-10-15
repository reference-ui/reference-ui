# ATM-SITE-91 — A package root's types declaration never shadows its exports source, so a value read through the package folds

Pins the atomic half of commit `41e62639d`. That commit made the shared ladder
source-first for package roots (styletrace's default) and left atomic on
`RootEntryPolicy::TypesFirst`, so atomic's value walk tries a root's top-level
`types` before its `exports` entry.

`brand-pkg` sits in `node_modules` the way a linked workspace package does. Its
manifest names `./dist/index.d.ts` as `types` beside
`"exports": { ".": "./src/index.ts" }`. The declaration is body-less
(`export declare const brand: string`); the source folds
(`export const brand = 'purple'`). `App.tsx` paints `css({ color: brand })`, so
the value must fold from the source: the want, the plan and the sheet all carry
`purple`, with zero diagnostics.

Sibling of ATM-SITE-54 (specifier resolution through `exports`); the difference
here is the `types` field beside the `exports` entry.

> Search terms: types, exports, RootEntryPolicy, TypesFirst, SourceFirst, declaration, package root, brand-pkg
