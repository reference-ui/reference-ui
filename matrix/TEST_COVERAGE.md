# Matrix Test Coverage

Matrix exists to answer ONE question: launch Reference UI, release it,
someone installs from npm into a fresh environment, and layers and
extends work. Matrix keeps exactly what can't be proved in local tests
or in one set of environments. Everything provable natively lives in
Core cases (`packages/reference-core/tests/cases/`) or Rust seam tests.

## The kept gate

Fifteen suites stay in `matrix/tests/`: the 11-tier chain set, three
package-composition tiers (T16, T17, T18), plus MCP. Every kept suite installs from packed tarballs via the
staged registry and runs setup in a virgin container on every run,
so each one re-proves the install dimension. Chain stays in one
place to test and reason about between-packages and
between-environments composition (distro/watch/etc. are decommissioned).

| Suite | Path | What it proves |
|---|---|---|
| `@matrix/chain-t1` | `matrix/tests/chain/T1` | Single extend: one upstream contributes fragment + tokens/types + portable CSS. |
| `@matrix/chain-t2` | `matrix/tests/chain/T2` | Single layer: one upstream contributes portable CSS only, with no token/type adoption. Sole single-mode `layers:` prover; stays until the `layers` config surface lands (D17). |
| `@matrix/chain-t3` | `matrix/tests/chain/T3` | Hybrid: one boundary using `extends` and `layers` at once. |
| `@matrix/chain-t6` | `matrix/tests/chain/T6` | Transitive extend: the app extends only the outer package, which republishes its base. |
| `@matrix/chain-t7` | `matrix/tests/chain/T7` | Diamond: two upstreams sharing one base, both extended. |
| `@matrix/chain-t8` | `matrix/tests/chain/T8` | Policy proof: the same upstream in `extends` and `layers` at once (coded allow-and-document). |
| `@matrix/chain-t9` | `matrix/tests/chain/T9` | Full mix: 2 extends + 2 layers with the `@layer` prelude order asserted. |
| `@matrix/chain-t10` | `matrix/tests/chain/T10` | Extend chain plus an app-level layered library; layered tokens must not leak. |
| `@matrix/chain-t11` | `matrix/tests/chain/T11` | Parallel extend chains: two independent transitive paths at one boundary. |
| `@matrix/chain-t12` | `matrix/tests/chain/T12` | Diamond base with mixed branches: one branch layered, one extended. |
| `@matrix/chain-t13` | `matrix/tests/chain/T13` | Parallel extend chains plus a shared app-level layer. |
| `@matrix/chain-t16` | `matrix/tests/chain/T16` | Prebuilt aliased-host composition: extends lib (transitive icons layers) plus a direct `layers` leg on `@fixtures/aliased-host-library`; asserts every emitted class has a backing rule, zero `no compiled class` warnings, and shell computed styles. |
| `@matrix/chain-t17` | `matrix/tests/chain/T17` | Consumer style props on prebuilt components (T16's topology): a consumer token, raw value, `css` prop, condition and tone paint on icons, a lib root and a fixture badge through rules backed under each package's published systems, with structured icons accounting and zero `no compiled class` warnings. |
| `@matrix/chain-t18` | `matrix/tests/chain/T18` | Component ownership by provenance: extends lib and `@fixtures/primitive-named-library`, layers icons; a tag imported from a package is backed under that package's published systems only, whatever its name or import shape (direct, namespace, barrel, `css` wrapper, published `jsxElements` name), with no spray and nothing configured. Sync legs under `tests/sync/`: `backed` and `unbacked` (icons composed or not, `ATM-W-EXTERNAL-UNBACKED` at the styled icon) and `partial`, the partly composed app (extends lib, not the fixture): one warning per styled fixture tag naming the package, its system and the `baseSystem` fix, and its props backed under no prefix. |
| `@matrix/mcp` | `matrix/tests/mcp` (19 files) | The whole MCP standard against the shipped artifact: tools, resources, icons, project discovery/switching, paths/symlinks, registry lifecycle, resilient boot — including packed-boundary `_private` legs over `@fixtures/extend-library`. |

Mixed tiers (T3/T9/T10/T12/T13/T16/T17/T18) exercise `layers:` legs in
combination; T2 is the isolated single-mode proof. All chain tiers
run over packed fixtures, so packed-boundary extends stays proven
in matrix.

Run the gate (objective-ordered hermetic proof, one package at a time):

```bash
pnpm agent test --packages=@matrix/chain-t1
pnpm agent test --packages=@matrix/chain-t2
pnpm agent test --packages=@matrix/chain-t3
pnpm agent test --packages=@matrix/chain-t6
pnpm agent test --packages=@matrix/chain-t7
pnpm agent test --packages=@matrix/chain-t8
pnpm agent test --packages=@matrix/chain-t9
pnpm agent test --packages=@matrix/chain-t10
pnpm agent test --packages=@matrix/chain-t11
pnpm agent test --packages=@matrix/chain-t12
pnpm agent test --packages=@matrix/chain-t13
pnpm agent test --packages=@matrix/chain-t16
pnpm agent test --packages=@matrix/chain-t17
pnpm agent test --packages=@matrix/chain-t18
pnpm agent test --packages=@matrix/mcp
```

Chain fixtures live at `matrix/fixtures/*` (flat, `@fixtures/*` names
preserved). Topology semantics: `CHAIN.md`. Composition contract:
`CHAIN_RULES.md`.

## Coverage homes for the retired suites

Every behavior below is covered EXACTLY once (one-coverage-home).
PORT = new Core case authored for it; DROP = pre-existing Core/RS
coverage; DROP* = retired-by-design legacy machinery with no home.

### Chain (stays in matrix, not ported)

The 11 tiers in the gate above are the coverage home for chain behavior
(packed-boundary proof over installed fixtures — what native
tests can't show). The `CORE-CHAIN-01..05` tier ports were deleted
as duplicates (one home = matrix). Kept alongside: `CORE-CHAIN-06`
(publisher-shape pin, no tier source — tiers re-cover the
scenario e2e, CHAIN-06 pins it fast) and pre-existing
`CORE-SYNC-10` (single-hop adopt). Still uncovered: T4 (parallel
extends) and T5 (parallel layers) have no tiers, and depth-3
chains have no tier.

### Lifecycle (PORT → new `CORE-CLI-*` / `CORE-WATCH-01`)

| Core case | Deleted matrix source |
|---|---|
| `CORE-CLI-01` one-shot lifecycle (idempotent re-sync, stale rewrite, SIGTERM recovery, clean-restore) | `distro` CLI-lifecycle core (~L280-446; virtual-mirror legs retired, skip stays skipped, types with TYPE) |
| `CORE-CLI-02` resident `--watch` flag path (boot, resync, shutdown) | No matrix source — closes the native gap |
| `CORE-WATCH-01` live-edit→paint loop + `CORE-SYNC-14` node-side watch | `watch-contract` all 3 tests (webpack leg retired) |

`distro` and `watch` suites are fully released (deleted outright):
their install dimension is re-proven by every kept tier's setup phase.

### Micro-ports (PORT → existing Core groups)

| Core case | Deleted matrix source |
|---|---|
| `CORE-PRIM-13` category-prefixed `colors.*` values + no-raw-leak pin | `primitives` L247 |
| `CORE-CSS-15` viewport media probes (840px halves) | `css` L277-302 |
| `CORE-COND-18` `& +` / `& ~` siblings in `css()` | `css-selectors` L65-75 |
| `CORE-PRIM-14` portal island (re-targeted, no Panda spelling) | `color-mode` L96-112 |
| `CORE-RESP-10` 8-leg viewport contract | `responsive` viewport-contract, whole file |
| `CORE-PRIM-15` corner-pair radius shorthands (12 corners) | `spacing` L143-175 (`box.d.ts` NOT ported) |
| `CORE-RECIPE-12` media+container conjunction on one class | `recipe` L265-274 |

Declined: typescript strict-wrapper (no Core `strict` surface;
`CORE-TYPE-02` is the equivalent home).

### DROPs (pre-existing homes, suite deleted)

- `recipe` / `primitives` / `system` / `tokens` rests → RECIPE / PRIM / SYNC / CSS / TOKEN / RESP / MERGE / PARITY cases.
- `reference` (both files) → `CORE-REF` 26/26.
- `css` / `css-selectors` / `color-mode` / `font` / `responsive` / `spacing` rests → Core css-family cases (Panda-theme spellings NOT ported — recorded divergence).
- `distro` rest → SYNC / TYPE cases.
- `session` (all 3) → retired sidecar, no home.
- `typescript` → `CORE-TYPE-01..04`.
- `virtual` (all) → no-mirror design, no home.
- `playwright` (both) → `CORE-SYNC-01` / `CORE-SMOKE-01` / `CORE-PLAY-B-01`.

### DROP* (retired with the cutover, no home needed)

Virtual-mirror legs, Panda pins/chrome, `box.d.ts`, pattern-pack
surface, session sidecar, playwright self-test, distro
generated-output, virtual-output pins, retired `strict` /
`mcp`-config spellings.

## Check procedure

Grep `matrix/tests` for residual assertions of ported/dropped
behavior — zero hits or the commit doesn't land. Every PORT row
shows a Core id plus its deleted matrix file; every DROP row shows
the pre-existing home; every KEEP row shows the file.
