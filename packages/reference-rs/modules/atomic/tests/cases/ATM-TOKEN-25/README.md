# ATM-TOKEN-25 — Keywords, numbers, lengths and real tokens on token-backed length props never warn

The silence side of `ATM-W-UNKNOWN-TOKEN`: `p: 'auto'` (a CSS-wide keyword), `p: '4'` (a bare number), `p: '2px'` (a length), `w: 'fit-content'` and `fontSize: 'larger'` (keywords the prop accepts), `borderRadius: 'sm'` (a real radii token, which resolves to `var(--radii-sm)`), and `fontFamily: 'upFont'` (fonts sit outside the length categories) all produce zero diagnostics. The baseSystem declares no spacing scale, so `p: '4'` misses the dictionary and must still stay silent.
Symbols: `bare_name::warn_unknown_token_name`, `LENGTH_KEYWORDS`, `canon::classify_css_value`.
Siblings: `ATM-TOKEN-24` (the warning side), `ATM-TOKEN-14` (CSS fences before lookup).
Contract: SPEC.

> Search terms: keyword, fit-content, larger, auto, bare number, length, real token, radii sm, fontFamily, silent, ATM-W-UNKNOWN-TOKEN
