# NEO-CSS-10 — `size`, `font`, and `weight` expand to multiple declarations from one prop

The world registers a `sans` font and calls `css()` with `size: '20px'`,
`font: 'sans'`, and `weight: 'bold'` on three probes. The spec checks the
sheet carries the width+height pair, the family var plus the registry
normal weight, and the bold weight; each probe carries its expanded class
set and paints width, height, family, and weight in computed style.

Evidence: `[atm]` P1 #9 (`docs/evidence/atomic-claims.md`), ATM-COND-05;
`[lib]` `docs/evidence/lib-sheet-styles-css.md` §3 shorthand row (`size_`
→ `width`+`height`).
