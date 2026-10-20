# CORE-TOKEN — tokens, islands, refs

Proves the named design values authored in fragments and emitted as CSS custom properties in `@layer tokens`: colours, spacing/rhythm, radii, fonts, keyframes, animations. Utilities and recipes consume them by name, by `{path}` ref, or by rhythm sugar (`4r`, `0.5r`); colour leaves carry `{ light, dark }` and print as `data-color-mode` islands. Owns the token, font and keyframe surface collectors. The group spec carries the token contract; the cases below are the ledger.

> Search terms: design tokens, token refs, rhythm sugar, color islands, data-color-mode, semantic aliases, keyframes, font registry, spacing root

CORE-EDGE-02 lives in this group: border radii resolve against radius tokens.

Open engine row: RS-32 (recipe and `globalCss` diagnostics must be deduplicated and canonical — the token10 fixture expects one warning but gets six identical `opacity/"1"` warnings, and `globalCss` props must canonicalize before token lookup so `fontFamily: 'sans'` resolves instead of warning verbatim; the fix flips token10 green).
