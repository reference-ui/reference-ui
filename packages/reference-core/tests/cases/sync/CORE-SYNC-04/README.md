# CORE-SYNC-04 — compile-request.json equals the frozen NativeCompileRequest sent to the engine

The runner syncs this world fresh, then the spec reads
the compile request node-side: its keys are exactly `schemaVersion`,
`spec`, `jsxHosts`, `sourceRoot`, `declarationRoot`, `include` (RS-10 evolved
the frozen shape with the glob scope); its bytes equal the
request `sync()` sent (rebuilt from the evaluated-system snapshot plus the expected
hosts and roots); `jsxHosts` is the config `jsxElements` (`CardFrame`,
`PanelShell`) plus every generated primitive named in the generated
`react.d.mts`; and the JSX-elements snapshot pins the merged multi-host
content. The styled sheet carries the brand utility,
proving the frozen `sourceRoot` scan extracted the world's want.

Mapping note (RS-1 verification): `compile()` accepts the frozen shape
(`atomic/js` `AnyCompileRequest`, case `ATM-SEAM-02`). Primitives come from
the primitives `TAGS` roster via `toJsxName` (`PRIMITIVE_JSX_NAMES`), which
the generator consumes to emit one component per tag while the JSX-elements step
keeps `primitives` empty — so `sync()` unions the config hosts with
`PRIMITIVE_JSX_NAMES` into `jsxHosts`.

Evidence: ATM-SEAM-02, the native compile-request fixture.

> Search terms: byte-exact, frozen-shape, host-union, tag-registry, native-bridge, frozen request, native request bytes, sync/compile-request, sync/jsx-hosts, CORE-SYNC-09
