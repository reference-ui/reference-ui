# NEO-SYNC-04 — compile-request.json equals the frozen NativeCompileRequest sent to the engine

The runner syncs this world fresh, then the spec reads
`system/compile-request.json` node-side: its keys are exactly `schemaVersion`,
`spec`, `jsxHosts`, `sourceRoot`, `declarationRoot`, `include` (RS-10 evolved
the frozen shape with the glob scope); its bytes equal the
request `sync()` sent (rebuilt from `evaluated-system.json` plus the expected
hosts and roots); `jsxHosts` is the config `jsxElements` (`CardFrame`,
`PanelShell`) plus every generated primitive named in the generated
`react.d.mts`; and `system/jsx-elements.json` pins the merged multi-host
content (coverage-map note a). The styled sheet carries the brand utility,
proving the frozen `sourceRoot` scan extracted the world's want.

Mapping note (RS-1 verification): `compile()` accepts the frozen shape
(`atomic/js` `AnyCompileRequest`, station `ATM-SEAM-02`). Primitives come from
`primitives/tags.ts` `TAGS` via `toJsxName` (`PRIMITIVE_JSX_NAMES`), which
`generate.ts` consumes to emit one component per tag while `jsx-elements.ts`
keeps `primitives` empty — so `sync()` unions the config hosts with
`PRIMITIVE_JSX_NAMES` into `jsxHosts`.

Evidence: `[decision D12]`, `[atm]` ATM-SEAM-02, coverage-map row 5 + note a, `contracts/fixtures/native-compile-request.json`, generated-folder-shape §7.

> Search terms: byte-exact, frozen-shape, host-union, tag-registry, native-bridge, frozen request, native request bytes, sync/compile-request, sync/jsx-hosts, NEO-SYNC-09
