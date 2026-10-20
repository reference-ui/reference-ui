# Font dialect

`font` and `weight` as one subsystem. Family expansion looks up the ingested font scale to stamp family, default weight, and extras; weight expansion resolves named or scoped weights with CSS-keyword fallback for misses; family scoping rewrites bare keyword weights to `family.name` form once per style root when exactly one family is active.
