# NEO-PARITY-03 — every §3 consumer specifier resolves from the world

Evidence: `[core]` generated-folder-shape §3 (specifier counts 89 / 31 /
1, the `../.reference-ui/system/baseSystem.mjs` re-export, the
`@reference-ui/react/styles.css` stylesheet import, zero styled importers).

The world is the same mini-lib as PARITY-01 (identical sources, synced
fresh so the census never reads a sibling's folder). The node-side spec
resolves each §3 specifier from the world through the linked generated
packages — package specifiers through Node resolution against the
published exports maps, path forms against the folder — re-verifies zero
`@reference-ui/styled` importers in lib src, and re-checks the D19
13-importer `types/` caveat against the live lib tree (11 at voyage time,
bounded, still live).

> Search terms: bare-specifier, node-resolution, import-graph, exports-wiring, resolution-check, importer census, 89/31/1, parity/consumer-resolution, parity/generated-shape, NEO-PARITY-01, NEO-PARITY-02
