# ATM-TOKEN-24 — An unknown token name on a spacing, radius, size or font-size prop warns ATM-W-UNKNOWN-TOKEN

A bare identifier on a token-backed length prop that names no token in that prop's category passes through raw and warns once: `p: 'upGap'` (spacing), `borderRadius: 'upRadius'` (radii), `fontSize: 'upSize'` (font sizes), and `w: 'upSize'` (sizes, which falls back to spacing and still misses). The baseSystem declares real tokens in each category, so every warning is a miss by name, not an absent scale.
Symbols: `warn_unknown_token_name`, `DiagnosticCode::UnknownToken`, `TokenDetail::UnknownToken`.
Siblings: `ATM-TOKEN-16` (the colour twin, `ATM-W-UNKNOWN-COLOR`), `ATM-TOKEN-25` (the keywords, numbers and real tokens that stay silent).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: unknown token, bare identifier, spacing, radius, size, font size, ATM-W-UNKNOWN-TOKEN, upGap, upRadius, upSize
