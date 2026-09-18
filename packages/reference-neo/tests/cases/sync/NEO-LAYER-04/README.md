# NEO-LAYER-04 — `normalizeCss: true` (default) opens with the reset layer; `false` omits it

The served world leaves the flag at its default: the sheet prints `@layer
reset` ahead of tokens and utilities, the `normalizeCss/reset` fragment rides
the compiled spec at `globalCss[0]`, and the browser agrees — a classless
`div` computes `border-box` and a bare `h1` loses its UA margin. A
`normalizeCss: false` twin world synced node-side keeps the six-name preamble
but prints no reset body and no reset rules.

Provenance note: this row belongs to the LAYER group (TESTS.md
`NEO-LAYER-04`), but the host rung is SYNC-owned (`sync/index.ts` +
`sync/reset.ts`), so the SYNC-mop slice proves it here under `sync/`; the
captain may move the folder home to `layer/` with no id change.

Evidence: `[lib]` `styles.css` reset layer; `[atm]` ATM-LAYER-08;
`[core]` `system/stylesheet/reset.ts` (Andy Bell); global-css research §6.3.
