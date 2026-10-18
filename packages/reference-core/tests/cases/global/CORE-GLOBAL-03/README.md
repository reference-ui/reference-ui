# CORE-GLOBAL-03 — nested `&` plus `_hover`/`_disabled`/`_focusVisible` twins on a tag recipe paint

The world authors one `.ref-button` global rule with a nested `&` slot
selector and the three interaction twins carrying token refs. The spec
checks the sheet carries the flattened slot rule plus the `:is()` twin
lists, then checks each twin paints computed: the real `disabled`
attribute, `data-hover`, and `data-focus-visible`. One rule per node —
no Panda comma-merge — cascade-equal to the lib sheet.

Evidence: reference-lib Trace C
(`button.ts` 20–27, 45–59 → `global.css` 371–407); reference-lib
`styles.css` L461–475; ATM-LAYER-03, ATM-COND-10.

> Search terms: nesting, ampersand selector, disabled state, interaction states, data attributes, triple twin, global/nesting, global/conditions, selector :is(), CORE-GLOBAL-12
