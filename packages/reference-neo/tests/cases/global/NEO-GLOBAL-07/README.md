# NEO-GLOBAL-07 — nested `@media` and `@container` inside `globalCss` wrap the rule and gate the paint

The world authors three global rules with nested at-rule keys: `.ref-note`
with a matching viewport `@media`, `.ref-far` with a never-matching one, and
`.ref-chip` with a `@container` width gate. The spec checks the sheet wraps
each rule in its at-rule inside `@layer global`, then checks computed paint:
the matching query paints, the far query does not, and the chip flips colour
across narrow, wide, and live-resized containers.

Evidence: `[panda-v1]` `core/__tests__/global-css.test.ts:285` "nested
at-rule"; `[atm]` ATM-COND-11.

> Search terms: responsive, breakpoints, min-width, max-width, at-rule nesting, global/at-rules, global/media, global/container, NEO-GLOBAL-02
