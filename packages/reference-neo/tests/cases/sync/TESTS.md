# SYNC ledger

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-SYNC-01 | Sync skeleton plus Rust handshake: folder shape exists and a token paints | done | none | — | generated files exist on disk; token colour paints the probe | `[core]` handshake |
| NEO-SYNC-02 | Folder matches §4.1 inventory: every expected path exists, every forbidden path absent; rewrites SYNC-01 in the same slice; folds the `tmp/` absence | done | none | `sync/publish.ts` stops writing `global.css`; `config/evaluate.ts` drops the empty `tmp/` root (`css.mjs` moves in SYNC-13) | node-side fs assertions over §4.1 lists | `[core]` generated-folder-shape §7, `[decision D2,D4]` |
| NEO-SYNC-03 | `baseSystem.mjs` is a `PortableBaseSystem`: `schemaVersion 1`, source-tagged `fragments[]`, `cssChunks[]`, `runtime`, `jsxElements[]` | done | none | `sync/publish.ts` shape | import the module in the spec; runtime shape checks | contracts `portable-base-system.json` |
| NEO-SYNC-04 | `compile-request.json` is written and equals the frozen `NativeCompileRequest`; pins `jsx-elements.json` merged content | done | ATM-SEAM-02 | `sync/native.ts`, `sync/index.ts` | keys exactly `schemaVersion, spec, jsxHosts, sourceRoot, declarationRoot`; `jsxHosts` equals config `jsxElements` + generated primitives | `[decision D12]` |
| NEO-SYNC-05 | Consumer specifiers resolve: `@reference-ui/react` → `react.mjs`, `./styles.css`, `@reference-ui/system` → `system.mjs`, `/baseSystem` | done | none | `sync/publish.ts`, `sync/react.ts` package.json exports | `import.meta.resolve` / `createRequire` from the world | `[decision D5]`, generated-folder-shape §3 |
| NEO-SYNC-06 | Two consecutive syncs produce byte-identical folders | done | ATM-ORDER-* | `sync/react.ts` stable entry path (esbuild stamps the random scratch path into the bundle) | hash every file twice | `[atm]` ATM-ORDER-* |
| NEO-SYNC-07 | Stale files from a previous sync are removed | done | none | `sync/index.ts` clean (already) | plant a junk file; sync; gone | `[core]` clean behaviour |
| NEO-SYNC-08 | Config errors are loud and named: missing `include`, missing/unsafe `name`, bad `jsxElements`, `extends` entry without synced data | done | none | `config/validate.ts` (already); `config/evaluate.ts` drops the empty out dir on failure | node-side `sync()` on seven bad worlds rejects with the documented messages | `[core]` validate tests, `[panda-v1]` `config/__tests__/validate-config.test.ts` (contrast) |
| NEO-SYNC-09 | `include` globs scope scanning: a `css()` outside `include` yields no utility | done | ATM-SCAN-01 (RS-10 landed) | `sync/index.ts` sends `include` on the frozen request; `compile-request.json` + SYNC-04 spec updated in the same slice | utility count | `[panda-v1]` `node/__tests__/glob-dirname.test.ts`, `[atm]` ATM-SCAN-01 |
| NEO-SYNC-10 | `extends: [upstream]` adopts upstream tokens, recipes, jsxElements; later fragment wins on the same leaf; arrays replace | done | RS-4 done | `fragments/base/merge.ts`, `sync/index.ts` (already; arrays-replace is unit-level — the token grammar admits no arrays) | two-system world: computed colour from upstream token; local override wins | `[panda-v1]` `config/__tests__/merge-config.test.ts` (contrast), Neo `merge.test.ts` |
| NEO-SYNC-11 | A compile diagnostic fails `sync` with file and line, and no folder is half-written | done | ATM-DIAG-01..03, ATM-TOKEN-12 | `sync/index.ts` surfaces `file:line[:column]`; folder atomic on failure (`display: true` warns by engine design — the failing input is the RS-3 located ref error; unblocks TOKEN-02) | world with `{colors.nope}`; `sync()` rejects; message has `path:line` | `[atm]` DIAG |
| NEO-SYNC-12 | `@reference-ui/system` exports the authoring surface and `getRhythm` returns the compiled rhythm root; decides the Book vite alias trap | done | none | `sync/publish.ts` system entry; `tsconfig.json` paths | node-side import; `getRhythm(4)` equals the token var/calc used in the sheet | `[decision D6]`, `[core]` core-api §2.1 |
| NEO-SYNC-13 | `styled` is data-only: no executable module besides `runtime-data.mjs`; `css()`/`recipe()` come from `react` bound to the owner | done | none | `sync/publish.ts`, `sync/react.ts` | forbidden `styled/css.mjs`; `react` exports `css`, `recipe`; `recipe` class carries `${system}__` | `[decision D4]` |
| NEO-SYNC-14 | `neo sync --watch` resyncs on addition, change, and deletion: parcel `create/update/delete` → `add/change/unlink`, include-scoped, debounced serial resync | done | none | `sync/watch.ts`, `bin/neo.ts` | node-side `watchSync()`: add a source (utility appears), rewrite one (utility swaps), delete both (utilities gone); `add`+`unlink` pinned, rewrite pins alignment | `[core]` watch behaviour |
| NEO-SYNC-15 | Zero-config discovery publish: traced `Card` lands in `local`/`merged` and `baseSystem.jsxElements`, the request stays primitives-only, `<Card p="1r">` paints, `Random`/`Label` stay silent, resync is byte-equal | done | ATM-SITE-56 (tracedJsxHosts on the result) | `sync/native.ts` seam, `sync/index.ts` publish-union, `jsxElements` escape-hatch doc | exact `jsx-elements.json`; `baseSystem` import; frozen six request keys; sheet utility count; `#card` paint; probe classlessness; discovery-bytes resync | `[atm]` ATM-SITE-56, `[decision D12]` |

## RS lane (filed by the SYNC-rest cook)

**RS-10** (landed; unblocked NEO-SYNC-09; NEO-SITE-07 leans on the same
lever; station ATM-SCAN-01 at the liaison's call). The frozen
`NativeCompileRequest` carried no `include` scoping: `atomic::compile`
(`modules/atomic/src/lib.rs` `gather_sources`) preferred the legacy `files`
list when non-empty and otherwise walked all of `sourceRoot` minus a fixed
ignore list. R1 probe (`/tmp/neo-r1/probe-sync09.mjs`, kept out of the repo):
a `css({ color: 'blue' })` in `outside/out.ts` yielded `neo-sync9__c_blue`
from a root scan — the outside-`include` utility existed until RS-10. Neo
could not fix this host-side: SYNC-04 pinned `compile-request.json` to
exactly the frozen five keys with byte-equality to the sent serialization, so
smuggling the legacy `files` field (or staging a filtered mirror, against
the D12 design note in `sync/index.ts`) would have broken a done row and the
frozen contract from the Neo side (PLAN §11).

- Input: two-file project, `include: ['theme/**']`; `theme/in.ts` holds
  `css({ color: 'red' })`, `outside/out.ts` holds `css({ color: 'blue' })`.
- Expected: the sheet carries the `red` utility and no `blue` utility; no
  diagnostic noise for the skipped file. Panda scopes by glob the same way
  (`node/__tests__/glob-dirname.test.ts` derives scannable roots from
  patterns).
- Liaison's call on shape (landed): an `include: string[]` glob field on
  the frozen request that the root scan honors (absent/empty preserves
  scan-all). The unblocking Neo slice sends `config.include` from
  `sync/index.ts` and updates `compile-request.json` plus the SYNC-04 spec
  (five keys → six) in the same slice. `collectCompileFiles` stays file
  collection only — the glob shape needs no file list.
