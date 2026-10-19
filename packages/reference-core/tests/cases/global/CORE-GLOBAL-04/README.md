# CORE-GLOBAL-04 — `_before`/`_after` with token colour paint

The world authors one `.ref-q` global rule with a token text colour plus
`_before`/`_after` quote marks. The spec checks the sheet carries the
`::before`/`::after` rules in `@layer global`, then checks the element
paints the token colour and both pseudos paint it computed with their
quote glyphs. One rule per node, no shared-declaration merging.

Evidence: reference-lib Trace D
(the inline reference 60–69 → `global.css` 1493–1504); ATM-LAYER-03.

> Search terms: pseudo-elements, content, generated content, color, quotation marks, generated quotes, global/pseudo-elements, global/token-ref
