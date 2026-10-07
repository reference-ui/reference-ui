---
date: 2026-09-25
role: rule-oracle-tasty
campaign: doom-night-0924
cluster: tasty-resolve
breaks: [r1-tasty, r2-stardefault, r2-tasty2, r3-defaultas]
verdicts: BREAK x4, CURIO x0
---

# Ruling: tasty resolve cluster (night R1–R3)

All four repros were run blind, exact commands, one at a time, in A→B→C→D
order. Each exited 1 with the break reproduced and its plant removed
(`mod.rs` clean, no `doom_*` files remain; the `M` entries under
`packages/reference-rs/modules/tasty/` are pre-existing campaign work,
not repro residue). Each repro's tsc ground-truth leg passed as claimed.

Severity ranking (all user-facing, none latent or cosmetic):
**B > A = D > C.** B mints phantom edges (wrong answers actively mislead
navigation and doc links); A/D drop real edges (silent degradation, broad
blast radius — every consumer import through an affected barrel); C drops
`resolved` payloads on a narrower shape (cross-file `typeof` only; the
local twin works). The finders' "user-facing" calls stand unchallenged.

Root-cause grouping: **A and D share one root cause and must fortify as
a unit.** B and C are independent fortifies. Detail per break below.

Common end-state rule for A, C, D (the silence clause): each named shape
must end **resolved or coded** — a `TST-*` diagnostic with a stable code
for every still-unresolvable input in the shape, or full resolution. No
third silent state survives fortify. B is the exception: silent exclusion
is the correct ESM behavior there (see B boundary).

---

## A. Two-hop named reexport chain dropped (R1) — BREAK, user-facing

- Hunt log: `.agents/doom/logs/2026-09-24-night-r1-tasty.md`
- Repro: `bash /tmp/doom-r1-tasty-two-hop.sh /Users/ryn/Developer/reference-ui`
- Firsthand: exit 1. Two-hop barrel map EMPTY with `diagnostics: []`;
  single-hop control green; tsc accepts the fixture. Confirmed.

Adjudication: genuine BREAK. Legal transitive ESM resolves per tsc; the
graph serves an empty barrel map and an unresolved consumer edge. The
violated contract is as filed (Identity + Navigation,
`ast/resolve/README.md:19`). Severity stands: index→mid-barrel chains
are the idiomatic monorepo pattern.

Root cause (shared with D): `resolve_symbol_id`
(`ast/resolve/index.rs:334-347`) probes the local shell table, then one
remote probe against the *target's shells* — never the target's export
map. The mid barrel holds only a reexport (no shell), so hop 2 misses,
and `ExportFold::collect` drops it via `filter_map` (`index.rs:106-118`)
with zero signal. There is no fix for A that is not also the fix for D:
any transitive/default-aware remote lookup through the folded target map
resolves both; any shell-table patch resolves neither in general.

### Fortify boundary (A+D as one unit)

- May change: `ast/resolve/index.rs` — `resolve_symbol_id`, the
  `ExportFold::collect` explicit-seed site, and whatever fold
  threading (cache/visited) the remote lookup needs. `ast/model.rs`
  only for a comment correction on `reexport_target` if its
  "(target file id, symbol name in target)" wording no longer
  describes the lookup key.
- Must move together: the A fix and the D fix (one change, both
  shapes — review rejects a patch that greens one red test without
  the other); the `filter_map` drop site's post-fix behavior (every
  remaining miss path gets a resolve-or-code decision, no silent
  residue); case inputs + `spec.ts` + `output/manifest.js` golden +
  case README as an atomic set.
- Ordering constraint (architecture, not prescription): `export_index`
  does not exist yet at `collect` time, so the remote lookup must live
  inside the fold's recursion/caching discipline with cycle safety
  (the `visited`-set protocol already exists for `export *`; named
  reexport cycles `a↔b` must terminate — pin termination, then decide
  diagnostic vs silence for the cycle case explicitly).
- Sweep obligations: re-run the full tasty case suite (`pnpm agentrs v
  tasty`) and inspect every golden diff — expected movement is
  strictly additive bindings in barrel maps (TST-RXP-01, TST-RXP-02,
  TST-IMP-01, TST-COL-01, TST-DUP-01, TST-STY-03, TST-SNK-01,
  TST-PAT-01 are the likely movers). Any *removed* binding or any diff
  in a non-barrel shape is suspect and blocks. Docs: `ast/resolve/README.md`
  responsibilities list gains the transitive/default rule; `src/README.md`
  only if contract wording changes.
- Stay untouched: `ast/extract/**` (`record_named_reexports` output is
  correct — the data is right, the lookup is wrong), `merge.rs`,
  `resolver/**`, `generator/**`, `scanner/**`. `diagnostics/**` stays
  shut unless the refuse-with-diagnostic path is chosen for some miss
  class — then `codes.rs` + `mod.rs` constructor + the shared
  `TST` registry + host-filter docs move together, new code appended
  per the table discipline, never a reused code.
- Pins owed: extend **TST-RXP-02** (already hosts the star-ambiguity
  pins) with a two-hop named chain input AND a single-hop
  `export { default as X }` input; `spec.ts` must assert **both**
  barrel-map attribution (canonical `sym:` ids) **and** downstream
  consumer `target_id`s for each shape independently (one combined
  assertion may mask the other — reject that). Plus a cycle-termination
  pin. Plus fail-without-fix proof: new specs red on the pre-fix tree
  (the doom red tests are the interim fail proof; the station spec is
  the durable pin).

---

## B. Star barrel mints phantom "default" (R2) — BREAK, user-facing (most severe)

- Hunt log: `.agents/doom/logs/2026-09-24-night-r2-stardefault.md`
- Repro: `bash /tmp/doom-r2-stardefault-default.sh /Users/ryn/Developer/reference-ui`
- Firsthand: exit 1. Barrel map
  `{"Named": ..., "default": "sym:src/origin.ts#Widget"}`; all three
  controls green; tsc accepts origin+barrel+direct and rejects the
  consumer with TS1192. Confirmed, including the tsc double-ground-truth
  (accepts the legal shape, rejects the phantom consumer).

Adjudication: genuine BREAK, and the most severe of the four — the only
wrong-answer find. A and D degrade to visibly-unresolved edges; B
resolves default-import consumers through star barrels to a binding ESM
says does not exist, actively misleading navigation. Distinct root cause
from R1 (mint by the star fold vs drop by `resolve_symbol_id`), as filed.
Severity stands, elevated within the cluster.

### Fortify boundary (independent; same file as A+D — sequence to churn goldens once)

- May change: `ast/resolve/index.rs` ONLY — the star fold
  (`StarFold::merge` or the `collect` star loop, `index.rs:120-128`).
  The exclusion must apply to **star-provided** bindings only.
- Must move together: the exclusion + the explicit-seed guard pin
  (`export { X as default }` alongside `export *` keeps `"default"` —
  `is_explicit_seed` already protects this; the pin proves the
  exclusion didn't overreach); spec + golden.
- Sweep obligations: every golden with a star barrel over a
  default-exporting origin (TST-RXP-02's `default-source` fixture is
  first suspect; then TST-SNK-01, TST-PAT-01, full `pnpm agentrs v
  tasty`). Expected movement is strictly *removal* of phantom
  `"default"` keys from barrel maps. Any added binding, any removed
  non-`"default"` binding, or any consumer edge flipping
  unresolved→resolved blocks.
- Stay untouched: `ast/extract/**` (the origin's `"default"` binding
  is correct — only the star copy is phantom), `resolve_symbol_id`
  and the named-reexport path (A+D's site — B must not alter it),
  `diagnostics/**` (**no new code**: silent exclusion is correct ESM
  absence; a diagnostic here would fire on every idiomatic star barrel
  over a default-exporting module — noise, not signal),
  `generator/**`, `scanner/**`.
- Pins owed: TST-RXP-02 additions — star-over-default-origin input,
  barrel-map-has-no-`"default"` assertion, phantom-consumer-unresolved
  assertion, explicit-`as default`-seed survival assertion. Plus
  fail-without-fix proof on the pre-fix tree.

---

## C. Cross-file `typeof` resolves None (R2) — BREAK, user-facing

- Hunt log: `.agents/doom/logs/2026-09-24-night-r2-tasty2.md`
- Repro: `bash /tmp/doom-r2-tasty2-cross-file-typeof.sh /Users/ryn/Developer/reference-ui`
- Firsthand: exit 1. Cross-file `typeof tokens.spacing` → `resolved:
  None`, empty diagnostics; local twin resolves; tsc accepts. Confirmed.

Adjudication: genuine BREAK. One import hop from a proven-resolving twin,
legal static TS, zero signal. The `resolved: Option` field is not a
license for this `None`: the resolver is *structurally incapable* of the
lookup (`Resolver` holds only the local `ParsedFileAst`; the type-query
path has no import arm while the `Reference` path does). Severity stands
(user-facing; theme/tokens `typeof` imports are idiomatic) with the
noted narrower blast radius than A/D.

Structural facts for the boundary: `Resolver` (`resolver/mod.rs:14-18`)
already carries `export_index` (file,export→symbol id) and the local
`import_bindings` (local→`ImportBinding{kind, imported_name,
target_file_id}`), but cross-file *value* lookup needs the target file's
`value_bindings` (`BTreeMap<String, TypeRef>`, per-file) keyed through
the target's `export_bindings` (export→local, so aliased
`export { t as tokens }` resolves). None of that is reachable from the
`Resolver` today — the fortify must build and thread it.

### Fortify boundary (fully independent of A/B/D)

- May change: `ast/resolve/resolver/resolve.rs` (the import arm in
  `resolve_type_query_expression`), `ast/resolve/resolver/mod.rs`
  (`Resolver` fields + `new`), `ast/resolve/index.rs` (build the
  cross-file value lookup + thread it into `Resolver`),
  `ast/model.rs` only if a new index type is warranted.
  `shared/type_ref_util.rs` is reuse-by-read; extend only if the
  member-walk cannot be shared as-is.
- Must move together: `Resolver` struct + constructor + every call
  site (`resolve_symbol_references` in `index.rs`); the lookup data
  must be built **once** in `resolve_ast`, never per-symbol
  (per-symbol rebuild over all files is O(symbols×files) — reject
  that shape on perf grounds); spec + golden + case README.
- Scope fence (explicit, non-negotiable): **named value imports only**
  (`import { tokens }`). Default-imported values, namespace-member
  values (`Ns.tokens`), and values arriving via re-export chains are
  OUT — they must be listed as known gaps in the case README, not
  silently half-handled. In-scope and must pin: aliased target exports
  (`export { t as tokens }` resolves through target
  `export_bindings`); `typeof` cycles (value whose type refers back)
  fail closed to `None`, never hang.
- Design hazard the fortify must answer (oracle flags, does not
  solve): borrowed `TypeRef`s carry `Reference`s in the *target*
  file's name context — the fortify states whether consumer-context
  re-resolution happens, and proves `resolved` composes with the
  VAL-01 downstream shapes (`keyof` / indexed-access over the
  imported `typeof`).
- Sweep obligations: TST-QRY-01 (extend — the import arm lives here),
  TST-VAL-01 (must pass **unchanged** — local value shapes untouched;
  any diff blocks), full `pnpm agentrs v tasty`. Docs:
  `ast/resolve/README.md` responsibilities if a new index exists.
- Stay untouched: `ast/extract/**` value-`TypeRef` production,
  `merge.rs`, `generator/**`, `scanner/**`, `diagnostics/**` unless
  refuse-with-diagnostic is chosen (then the codes.rs + registry +
  docs atomic set, per the A+D clause).
- Pins owed: TST-QRY-01 extension (cross-file named-import `typeof`
  resolves; aliased target export resolves; cycle fails closed) plus
  one TST-VAL-01 composition assertion (`keyof typeof <imported>`
  resolves — the downstream shape the log names). Plus
  fail-without-fix proof on the pre-fix tree.

---

## D. `export { default as X } from` single-hop drop (R3) — BREAK, user-facing

- Hunt log: `.agents/doom/logs/2026-09-24-night-r3-defaultas.md`
- Repro: `bash /tmp/doom-r3-defaultas-repro.sh /Users/ryn/Developer/reference-ui`
- Firsthand: exit 1. Barrel map `{}`, `diagnostics: []`; target-map
  control green; tsc accepts; restore byte-identical. Confirmed.

Adjudication: genuine BREAK. The mechanism as filed is exact and was
verified read-only: `record_named_reexports`
(`module_bindings/exports.rs:146`) records
`reexport_target["default"] = (target, "default")`; `resolve_symbol_id`
probes `symbol_index[(target, "default")]`; `build_symbol_index`
(`index.rs:245-257`) keys shells by declared name, so no shell is ever
named `"default"` — the hop misses **unconditionally**, by key
construction, on every input. Single-hop (strictly simpler than A, no
transitivity needed) yet total silence. The TST-RXP-02 near-miss noted
in the log (fixture holds the syntax but targets an unminted value
literal and asserts nothing) is correct and sharpens the pin requirement:
the durable pin must target a default-exported *type*. Severity stands:
default re-cased through a barrel is idiom.

Fortify boundary: **identical to A — one unit.** The A+D boundary above
governs both. The only D-specific addition: the TST-RXP-02 pin input must
use a default-exported *type* (`export default interface …`), never a
value literal, or the pin repeats the existing fixture's blind spot.

---

## Cross-fortify notes

- A+D and B all touch `ast/resolve/index.rs` (`collect` region). They
  may land in either order, but the second lands on the first's tree
  and re-baselines goldens once — no interleaved partial baselines.
- C touches `index.rs` only as threading (built-once lookup) plus
  `resolver/**`; it may proceed fully parallel to A/B/D.
- No fortify in this cluster is authorized to change emitted-manifest
  shapes, host APIs, or the `TST` registry beyond the single
  conditional new-code path each boundary names.
- The doom red tests (`/tmp/doom-*.sh` + transient plants) are interim
  fail proof only. Durable pins are the station specs + goldens named
  above; a fortify is not done until its station spec is red-on-prefix
  demonstrated and green-on-fix in `pnpm agentrs v tasty`.
