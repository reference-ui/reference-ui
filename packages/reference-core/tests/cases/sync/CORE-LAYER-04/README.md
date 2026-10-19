# CORE-LAYER-04 — `normalizeCss: true` (default) opens with the reset layer; `false` omits it

The served world leaves the flag at its default: the sheet prints `@layer
reset` ahead of tokens and utilities, the `normalizeCss/reset` fragment rides
the compiled spec at `globalCss[0]`, and the browser agrees — a classless
`div` computes `border-box` and a bare `h1` loses its UA margin. A
`normalizeCss: false` twin world synced node-side keeps the six-name preamble
but prints no reset body and no reset rules.

Placement note: this row belongs to the LAYER group (the case ledger
`CORE-LAYER-04`), but the host rung is SYNC-owned (the sync entry +
the sync reset), so the case lives under `sync/`.

Evidence: reference-lib `styles.css` reset layer; ATM-LAYER-08;
global-css research §6.3.

> Search terms: box-sizing, user-agent, preflight, opt-out, preflight switch, cascade baseline, layer/reset-layer, sync/normalize-flag, CORE-TOKEN-10
