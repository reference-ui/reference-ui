# ATM-TOKEN-14

Complete CSS values are never token paths: `rgba()`, `oklch()`, `color-mix()`, `translateX()`, `calc()`, and `url()` pass through silently while the dictionary still resolves `gray.800` and still warns on `ui.missing.path`.
Symbols: `resolve_token_value`, `is_whole_css_value`, `canon::classify_css_value`, `ValueKind`.
Siblings: `ATM-TOKEN-09` (category breadth), `ATM-TOKEN-16` (§11 bare values), `ATM-SITE-45` (token-call refusals).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: alphabet fence, freestyle CSS, unknown token path, classify, rgba, translateX, color-mix, calc, oklch, url
