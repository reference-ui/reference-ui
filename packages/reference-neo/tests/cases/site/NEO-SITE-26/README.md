# NEO-SITE-26 — Interpolated templates fold in browser, dynamic parts diagnose

The world styles four nodes: the folded node through a const-member part
(`` `${o.shade}` ``), the sized node through a const-number part with a unit
quasi (`` `${n}px` ``), the fan node through a const-ternary part over a
permanently open test (both arm utilities minted, the runtime paints the
live plum one), and the refused node through a dynamic part beside a static
background sibling. The spec asserts cherry paint, 4px width, live-arm plum
paint, and ocean-only paint on the refused node, the sheet carries exactly
the five utilities, and the frozen-request recompile carries exactly the
one positioned part warning naming `dyn`.

Evidence: `[atm]` ATM-SITE-51 (template fold table);
`[overmatch]` SPEC-V2-67; `[panda-v2]`
`vendor/panda/crates/pandacss_extractor/tests/scope.rs:868`, `:887`,
`calls.rs:1214`, `:1420`, `:1972`.

Repin (Forge Slice 3): the `fan` node paints CSS `plum`
(rgb(221, 160, 221)), not the world's `plum` token (#a855f7). Per the
signed §9 fence and H1, a bare value the alphabet accepts is complete
CSS — never a token path, never warned — so CSS wins over the
same-named token while the cherry and ocean siblings still resolve
through `var()`. The token stays declared deliberately: this case now
pins CSS-over-token precedence for the fanned ternary arm.

> Search terms: template literals, interpolation, fold table, fan-out, multi-leaf parts, refused parts, siblings kept, NEO-SITE-24, ATM-SITE-51
