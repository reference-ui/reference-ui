# NEO-TOKEN-15 — the spacing-root rescale knob: one globalCss :root line doubles rhythm paint

Every rhythm utility lowers against `--spacing-root`: `1r` is the var
itself, `Nr` is `calc(N * var(--spacing-root))`. The engine bakes a
`0.25rem` default in `@layer root`, ranked below all author CSS so any
author definition wins. That makes rescaling the whole UI one line,
and this spelling is the canonical knob:

```ts
globalCss({ ':root': { '--spacing-root': '0.5rem' } })
```

The world sets exactly that line, paints `p: '4r'` and `p: '1r'`
probes, and the spec pins the doubled paint: computed root `0.5rem`,
`32px` and `8px` against inline references. Sheet pins: the baked
default still opens the sheet (the author line outranks it, never
replaces it), the sheet defines the root exactly twice, and the author
`0.5rem` rides the own package's `@layer global`.

Related: `NEO-TOKEN-07` (rhythm lowering at the default root),
`NEO-CHAIN-07` (author-wins across an extends chain), `ATM-ROOT-01/02`
(the baked default and override at the compile seam).

> Search terms: spacing root, rescale, spacing feel, ui density, rhythm scale, globalCss root, NEO-TOKEN-07, NEO-CHAIN-07, ATM-ROOT-02
