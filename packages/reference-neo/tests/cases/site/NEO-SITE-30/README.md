# NEO-SITE-30 — Partial-guard Tabs indicator paints both arms

The world renders two tabs whose indicator rides the verbatim `Tabs.tsx` guard — `const isSelected = context ? context.value === value : false` gating `borderBottom` and `borderBottomColor` ternaries. The binding drops its comparison arm beside `false`, so the extractor must keep both use-site arms: the sheet carries the 3px width, the ring color, and the transparent color, the selected tab paints a solid ring indicator, and the plain tab paints the transparent arm through the same runtime plan index.

Evidence: `[atm]` ATM-SITE-86; `[lib]` `Tabs.tsx` Tab indicator (selected/transparent arms).

> Search terms: tabs indicator, isSelected, partial guard, dropped arm, residue, test folding, dead branch, NEO-SITE-17
