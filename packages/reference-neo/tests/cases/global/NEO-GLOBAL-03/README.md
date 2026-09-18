# NEO-GLOBAL-03 — nested `&` plus `_hover`/`_disabled`/`_focusVisible` twins on a tag recipe paint

The world authors one `.ref-button` global rule with a nested `&` slot
selector and the three interaction twins carrying token refs. The spec
checks the sheet carries the flattened slot rule plus the `:is()` twin
lists, then checks each twin paints computed: the real `disabled`
attribute, `data-hover`, and `data-focus-visible`. One rule per node —
no Panda comma-merge — cascade-equal to the lib sheet.

Evidence: `[lib]` `docs/evidence/lib-sheet-global-css.md` Trace C
(`button.ts` 20–27, 45–59 → `global.css` 371–407); `[lib]`
`styles.css` L461–475; `[atm]` ATM-LAYER-03, ATM-COND-10.
