# NEO-PRIM-07 — colorMode islands repaint token and _dark utilities at three depths

The world renders a three-deep primitive tree: a default surface, a
`colorMode="dark"` island inside it, and a nested `colorMode="light"` island.
Each depth paints one probe with a light/dark `ink` token and one probe with
a `brand` base plus a `_dark` paper override through the `css` prop. The spec
checks the stamps land on the islands, the sheet carries the token islands
and the scoped `_dark` rule, and computed colours repaint per depth. The
nested island flips the token var back to light; the `_dark` override still
paints there because it answers to any dark ancestor (COND-03's contract).

Evidence: `[atm]` P0 #1, ATM-COND-03/08; `[decision D1]`.
