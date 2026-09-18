# NEO-LAYER-06 — token-layer vars resolve inside recipe rules and utility rules alike

The world declares one `brand` token and paints two probes from it: a
card recipe whose base reads the token, and a plain `color` utility. The
spec checks the sheet carries the brand var in the tokens layer with both
the recipe rule and the utility rule referencing it, then checks computed:
both probes paint brand. One token, two layers, same paint.

Evidence: `[lib]` token-backed recipe/utility paint; `[atm]` ATM-LAYER-03.

> Search terms: --colors-brand, var(), token reference, shared token, cross-layer, token visibility, layer/tokens, tokens/var-resolution, NEO-LAYER-01
