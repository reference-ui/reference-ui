# NEO-SYNC-09 — include globs scope scanning: a css() outside include yields no utility

The world declares `include: ['theme/**']` with `css({ color: 'red' })` in
`theme/in.ts` and `css({ color: 'blue' })` in `outside/out.ts`. The runner
syncs fresh, then the spec counts utilities node-side: the sheet carries
exactly one `neo-sync09__c_red` and zero `neo-sync09__c_blue`, while
`system/compile-request.json` pins the `include` globs `sync()` sent on the
frozen request (RS-10). The skipped file fails silent engine-side — the
station records zero diagnostics for it — so sync surfaces nothing.

Evidence: `[panda-v1]` `node/__tests__/glob-dirname.test.ts`, `[atm]` ATM-SCAN-01 (RS-10), TESTS.md RS lane.

> Search terms: allowlist, scan-boundary, silent-skip, deny-by-default, in versus out, scoped scan, sync/include-scope, sync/scan-filtering, NEO-SYNC-04
