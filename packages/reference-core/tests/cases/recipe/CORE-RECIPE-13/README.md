# CORE-RECIPE-13 — a slotted recipe resolves one class string per slot and every part paints

The world defines one `card` recipe with `slots: ['root', 'title', 'body']`.
It adds two variant axes, a boolean axis, and a compound keyed to the title
slot and defaults. It then paints six probe groups: defaults, a loud large
selection, a runtime-picked size, a responsive size in a narrow and a wide
container, a raw()-fed title and a splitVariantProps() title. The spec checks
the sheet and runtime tables per slot, resolves the same selections node-side,
and proves each part paints its computed styles.

Evidence: ATM-RECIPE-10.

> Search terms: slots, slotted recipe, multi-part, sva, per-slot classes, recipe/slots, CORE-RECIPE-14, CORE-RECIPE-05, CORE-RECIPE-08
