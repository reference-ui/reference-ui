# NEO-COND-16 — css()-nested `&:where(:has())` collapses icon-only buttons

The world styles an icon-only button and a text button with one class
carrying `paddingInline: '20px'` plus the `&:where(:has(...))` collapse
to `'0'` (`button.ts:29` verbatim). The spec checks the sheet carries
the bare utility and the substituted `:where(:has(...))` rule, the
icon-only button paints `0px`, and the text button keeps `20px`. The
frozen-request recompile carries zero diagnostics.

Evidence: `[atm]` ATM-COND-22; `[overmatch]` SPEC-V2-49; `[panda-v2]`
`vendor/panda/crates/pandacss_stylesheet/tests/nested_selector_parity.rs:389`.

> Search terms: where has, icon-only button, functional pseudo, nested selector, collapse
