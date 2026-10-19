# CORE-CSS-15 — `css()` viewport `@media` probes paint per the viewport width

The world calls `css()` once with a base branch plus an
`@media (min-width: 840px)` branch on one class. The spec checks the
sheet carries the base utility plus the wrapped 840px rule, and the
browser proof sets the viewport below and above 840px: base padding
and transparent paint below, the queried padding and colours above.
The viewport — not a container — gates the branch.

Matrix source: the CSS contract spec "keeps the
viewport media-query probe on its base branch below the viewport
threshold" + "applies the viewport media-query branch above the
viewport threshold" + the `viewportProbeClass` probe.

> Search terms: viewport, media query, min-width, screen breakpoint, css-viewport-probe, CORE-CSS-15
