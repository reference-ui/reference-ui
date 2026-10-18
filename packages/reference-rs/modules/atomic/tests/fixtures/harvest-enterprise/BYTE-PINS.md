# Harvest census byte pins: dated history

The enterprise census (`tests/suites/harvest-census.test.ts`) pins its byte cells in
`tests/harness/harvest-census-pins.ts`. This file keeps the dated history behind those pins:
one entry per landing that moved bytes, with the A/B that proved each move. Re-verify the cells
whenever acceptance moves bytes, and add the entry here with the new pin.

## styles.css cells (cssRaw, cssGzip, cssBrotli, stylePlans, harvestWants)

```text
2026-10-06 gray re-pin: gray.950 anchored to onyx #040711 with hue matched
up the ramp; token value string lengths moved -19 raw, +4 gzip, +82 brotli.
stylePlans/harvestWants unchanged.
2026-10-07 color-allowlist re-pin: harvested colors narrow to token-
licensed words + currentColor/transparent + CSS-wide keywords; the 1249
unlicensed color wants leave the sheet (-100075 raw, -13055 gzip,
-5656 brotli) and stylePlans one-for-one.
2026-10-12 tones re-pin: the lib system ships eight `--tones-*` root
declarations, adding +245 raw, +48 gzip, +7 brotli; stylePlans unchanged.
```

## react.mjs cells (reactRaw, reactGzip) and the derived counts

```text
C5: +599 raw / +171 gzip is runtime derivation code (stem/key/index/
compound ports); the fixture ships 0 recipes so its data bytes are 0.
Axis shorthands: +42 raw is the four baked names
("marginX","marginY","paddingX","paddingY"); the rest of the move from
the 149479/32889 pin is in-flight tree drift, re-verify at landing.
2026-09-25 -> 158073/39595 post-Jettison (Slices 0-4 + W4 legs);
2026-09-28 landing -> 158317/39664 (+244/+69), react.mjs-only with all
CSS pins green (red since before root-var). 2026-09-28 NAMER ->
158291/39659 (-26/-5): miss.ts comma-split deletion shrinks the
shipped probe. 2026-10-08 font-weight runtime -> 159077/39933
(+786/+274): scope.ts family scoping ships in react.mjs via css();
A/B without scope.ts reproduces 158291/39659 exactly, CSS pins green
throughout. 2026-10-08 bundler unification Arc D -> 153457/37735
(-5620/-2198): the probe bundles dist/primitives.mjs (minified) in, and
the raw-esbuild leg drops tsup's SWC __name wrappers plus the node:
strip from it; A/B with the tsup-built dist reproduces 159077/39933
exactly. 2026-10-10 F2 diagnostic miss-message change -> 153469/37738
(+12/+3): the css() miss message carries the class name and the call
site, react.mjs-only with all CSS pins green. 2026-10-13 data-layer stamp
follows the ancestor's system (0b124ea85, CORE-LAYERS-09) -> 153626/37786
(+157/+48): the context.ts stamp rule, react.mjs-only; A/B with only that
file reverted reproduces 153469/37738 exactly, CSS pins untouched.
2026-10-15 recipe dev-warn (3eefd6318) and namer weight fallback
(3eefd6318) -> 154208/38004 (+582/+218): recipe.ts + css.ts at dc35f0c6a
give 153716/37805 (+492/+199), lower.ts at dc35f0c6a gives 154118/37986
(+90/+18); raw sums to the total, gzip leaves one byte (77b21e2bf and
45ad65b9d not A/B'd); 3eefd631 is mcp-only; CSS pins untouched.
2026-10-15 runtime prod gate -> 154213/38023 (+5/+19): runtime/env.ts
replaces the typeof-process guard and the packager keeps
process.env.NODE_ENV unbaked for the consumer's bundler; A/B with only
those core files reverted reproduces 154208/38004 exactly, CSS pins untouched.
2026-10-16 readDocumentColorMode split into document and attribute helpers
(98f0e48dc, context.ts only) -> 154255/38043 (+38/+10); A/B with the split
reverted reproduces 154217/38033 exactly, CSS pins untouched. The 154213/38023
pin already read 154217/38033 before the split (+4/+10, likely the uncommitted
reference-core runtime edits; not A/B'd here).
2026-10-18 miss probe reads spaced hex escapes (issue #15, namer/miss.ts
CLASS_TOKEN only) -> 154277/38048 (+22/+5): a digit-led system's selectors
spell `.\30 1-app__...`; A/B with miss.ts reverted reproduces 154255/38043
exactly, CSS pins untouched.
Re-verify if acceptance moves bytes.
```
