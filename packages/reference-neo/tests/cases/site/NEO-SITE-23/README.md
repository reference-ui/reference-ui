# NEO-SITE-23 — Element access, folded keys, and flattened spreads paint

The world styles four nodes from the fold slice: one `css()`
call mixing a folded identifier index (`colors[k]`), a literal index
(`colors['red']`), a const-array read (`sizes[1]`), and a folded computed
key (`[pad]`); a value array with a flattened literal spread (`['1px',
...['2px', '3px'], '4px']`); a merge list with a flattened literal spread;
and a refused dynamic index (`colors[dk]`) beside a static sibling. The
spec checks the sheet carries exactly the eleven utilities, every folded
shape paints its declaration (the flattened array at narrow and wide
container widths, the merge in last-wins pink), the refused node paints only its
sibling, and a fresh compile of the frozen request reports the `dk`
warning located at the world's `app.ts` — sync itself succeeds.

Evidence: element access, folded keys, flatten; Panda v2 scope tests (computed
string key, ident key, index) and call tests (literal spread, computed key);
ATM-SITE-48, ATM-SITE-49, ATM-SITE-37.

> Search terms: element access, computed member, folded key, flatten, spread, breakpoint arity, site/element, NEO-SITE-22
