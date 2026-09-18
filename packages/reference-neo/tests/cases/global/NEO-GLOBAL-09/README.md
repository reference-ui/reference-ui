# NEO-GLOBAL-09 — the sheet carries no Panda chrome and no `global.css` file is written

The world authors one token-coloured global rule so the global layer is
non-empty. The spec checks the whole sheet for the Panda signature and the
universal transform-var dump and finds neither, checks the global layer does
carry the authored rule (so the negative is not vacuous), and checks the
styled folder contains no `global.css` file.

Evidence: `[decision D2,D7]`; coverage-map row 11.
