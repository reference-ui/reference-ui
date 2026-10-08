# NEO-SITE-20 — Wrapped `css()` args paint exactly like the bare arg

The world styles one node per arg wrap form — bare, parens, `as const`,
`satisfies`, non-null `!`, and the `.ts`-only angle assertion
(`<CssStyles>`, the same `TSTypeAssertion` node as v2's `<any>`) — each
with a distinct color leaf. The spec asserts every node paints its leaf,
the sheet carries exactly the six utilities, and the frozen-request
recompile carries zero diagnostics: wrappers erase, they never refuse.

Evidence: `[atm]` ATM-SITE-26 (call-arg unwraps);
`[overmatch]` SPEC-V2-06, SPEC-V2-07; `[panda-v2]`
`vendor/panda/crates/pandacss_extractor/tests/calls.rs:1001`, `:1017`,
`:1033`, `:1052`, `:1068`.

Repin (Forge Slice 3): the `asserted` node paints CSS `plum`
(rgb(221, 160, 221)), not the world's `plum` token (#a855f7). Per the
signed §9 fence and H1, a bare value the alphabet accepts is complete
CSS — never a token path, never warned — so CSS wins over the
same-named token while the five sibling tokens still resolve through
`var()`. The token stays declared deliberately: this case now pins
CSS-over-token precedence for the angle-assertion wrap.

> Search terms: call arg unwraps, as const, satisfies, non-null assertion, angle assertion, parens, wrapped args, NEO-SITE-24, ATM-SITE-26
