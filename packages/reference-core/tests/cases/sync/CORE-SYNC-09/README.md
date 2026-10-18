# CORE-SYNC-09 — include globs scope scanning: a css() outside include yields no utility

The world declares `include: ['theme/**']` with `css({ color: 'red' })` in
`theme/in.ts` and `css({ color: 'blue' })` in `outside/out.ts`. The runner
syncs fresh, then the spec counts utilities node-side: the sheet carries
exactly one `core-sync09__c_red` and zero `core-sync09__c_blue`, while
`system/compile-request.json` pins the `include` globs `sync()` sent on the
frozen request (RS-10). The skipped file fails silent engine-side — the
case records zero diagnostics for it — so sync surfaces nothing.

Evidence: Panda v1 glob-dirname tests, ATM-SCAN-01 (RS-10), the reference-rs gaps section of TESTS.md.

> Search terms: allowlist, scan-boundary, silent-skip, deny-by-default, in versus out, scoped scan, sync/include-scope, sync/scan-filtering, CORE-SYNC-04
