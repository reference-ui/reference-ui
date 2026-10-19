# CHAIN — case ledger

One row per case. Status words: `open`, `in-progress`, `done`,
`blocked-on-rs`, `approved-absence`, `retired`.

- CORE-CHAIN-01 transitive extends — `done` — ports T6; also homes T10 extends legs.
- CORE-CHAIN-02 diamond extends — `done` — ports T7; also homes T12 extends legs.
- CORE-CHAIN-03 parallel chains — `done` — ports T11; also homes T13 extends legs.
- CORE-CHAIN-04 parallel direct extends — `done` — ports T9 extends legs; T4 topology.
- CORE-CHAIN-05 depth-three chain — `done` — new coverage; no matrix source.
- CORE-CHAIN-06 real upstream sync output — `done` — structural: extends a genuinely synced upstream package; no matrix source.
- CORE-CHAIN-08 prebuilt dist fan-out probe — `done` — structural: consumes a prebuilt package component fixture bound to a foreign `react.mjs` and styles it with a consumer-only token. Green after the fan-out engine (class `core-chain8-up__c_chain8Ink` backed); the local `Div` control isolates the miss to the prebuilt path.
- CORE-CHAIN-09 a branch's override survives in either order — `done` — structural: real-sync diamond; the fragment list linearizes by first occurrence (E1, E2, E5); no matrix source.
- CORE-CHAIN-10 a shared base is evaluated once — `done` — structural: real-sync diamond; the shared base is one node in the published list (E2, E6); no matrix source.
- CORE-CHAIN-11 a cycle reached through fragment names fails sync with a named error — `done` — structural: a stand-in whose fragment names reach the app; the rejected sync leaves the published system byte-identical (E7); no matrix source.
- CORE-CHAIN-12 a local token that replaces an upstream value warns once per path, naming both values — `done` — structural: local leaves over two stand-ins; one BSS-W-TOKEN-SHADOW warning, equal and upstream-over-upstream legs silent (E13); no matrix source.
- CORE-CHAIN-13 a local light-only override drops the upstream's dark value — `done` — structural: a mode leaf replaced whole by a light-only leaf, proven by the evaluated spec, the sheet, and a light paint (E14); no matrix source.
- CORE-CHAIN-14 an upstream that publishes a component as owning size keeps size off the downstream's call sites: no rule, no warning — `done` — structural: a real-sync upstream publishes `jsxOwned { Tile: ['size'] }`; a downstream that extends it and passes `size="lg"` gets no `lg` rule and no `ATM-W-UNKNOWN-TOKEN` warning, while a `Div` control still folds its size (E16); no matrix source.
- CORE-CHAIN-15 an installed package's Button and published Tile paint a consumer token whether imported directly, through a barrel, or under a css wrapper — `done` — structural: a real-sync package (`@fixture/chain15`, its `dist/` built from source) is linked into `world/node_modules`; the app extends its published system and styles each import shape with a consumer-only token, all four paint with zero runtime misses (component ownership by provenance, the package found where its import lands); red on `public-release`; matrix T18 is the packed-tarball twin.
- CORE-CHAIN-16 an installed package whose system the app does not compose warns ATM-W-EXTERNAL-UNBACKED once per styled tag site and backs nothing; a non-Reference package stays silent — `done` — structural: CORE-CHAIN-15's import shapes with the installed package not composed, first with nothing composed, then with another real system composed; `sync()` and `ref sync --json` both carry one warning per styled package tag site at its file and line, naming the package, its system and `<pkg>/baseSystem`; unstyled, forwarding, own and plain-package tags silent; the sheet sprays nothing under the other system; red (no rows, sprayed) on `public-release`; matrix T18's partly composed leg is the packed-tarball twin.
