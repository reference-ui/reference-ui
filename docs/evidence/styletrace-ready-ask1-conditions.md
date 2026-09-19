# READY ask 1 — Challenge the design: condition keys, engine vs printer

Verdict: **no blocker**. On the real lib tree the two sides match exactly
(props 873 = 873, conditions 84 = 79 + 5). One plan-wording mismatch is
named below as slice-3's first red test: the `neo_decl_roots` 8-name
fixture cannot *equal* `from_engine` output. Two further notes (authored
conditions, `@sm` lowering) are pre-existing typegen/extractor gaps shared
by both paths — not drift risks.

Probe: `/tmp/st-ready-ask1.mjs` (read-only; re-runnable).

## Where the spec's condition keys live on Rust `BaseSystem`

Three kinds, two homes. There is **no** separate container-query key list.

| Kind | Lives on | Shape |
|---|---|---|
| Named conditions | `BaseSystem.conditions: ConditionMap` (`modules/base-system/src/lib.rs:61`), lowered from `lib_conditions()` (79 `_`-keys) + authored `spec.conditions` overlay (`lower/mod.rs:52-65`) | `_hover` … (authored keys may be bare, e.g. `dark` replaces `_dark`) |
| Breakpoints | `BaseSystem.breakpoints: BreakpointScale` (`lib.rs:60`), `from_profile_and_authored` (`breakpoints.rs:39-66`) | plain names, `base` first: `base,sm,md,lg,xl,2xl` (+ authored extras) |
| Container queries | **derived, not stored**: `named_breakpoint` / ranges lower plain names to `@container (min-width: Npx)` (`atomic/src/resolve/conditions/mod.rs:107-179`); raw `@container…` author spellings pass through (`mod.rs:181-189`); `r/` keys stamp queries in extract | — |

Lib's evaluated spec authors neither (`evaluated-system.json` has no
`breakpoints`/`conditions` keys), so lib = standard scale + 79 lib
conditions.

## What typegen's `StyleConditionKey` printer emits

`modules/typegen/src/emit/style.rs:150-162` (`condition_keys`):

- `canon::NAMED_CONDITIONS` verbatim (79, `_`-prefixed), **ignoring
  `system.conditions`** — authored custom conditions never reach the type;
- `@` + each breakpoint name except `base` (lib: `@sm @md @lg @xl @2xl`).

The `@` prefix exists **only** in the printer — no `BaseSystem` field
carries it. `from_engine` must replicate the prefix, not read it.

## Side-by-side: real lib tree

| Set | Disk (`packages/reference-lib/.reference-ui/`) | Engine (Rust sources) | Result |
|---|---|---|---|
| Style props | `react/react.d.mts` `StylePropName`: **873** (sorted; has `font weight r size container`; lacks `variant colorMode`) | `get_style_prop_names()` = 850 canon + 22 aliases + `r,size,weight`: **873** (`atomic/src/runtime/plan.rs:83-97`) | **identical, key-for-key** (expected: disk union is baked from `result.runtime.stylePropNames`, `sync/index.ts:99-103` → `generate.ts` passthrough) |
| Conditions | `styled/types/index.d.ts` `StyleConditionKey`: **84** (79 `_` + 5 `@`) | canon 79 + `@`+bps 5 = **84** | **identical, key-for-key** |
| Named table | — | `lib_conditions` keys vs `canon::NAMED_CONDITIONS` | **identical** (`diff` clean, 79 = 79) |

So `StyleSurface::from_engine` **can** reproduce the disk surface exactly
on the real tree, and the engine surface is nowhere narrower than disk.

## Side-by-side: `neo_decl_roots` fixture

Fixture disk surface (`styletrace/src/tests/neo_decl_roots.rs:59-74`): 8
names — `_focus _hover color container font fontSize margin weight`. All
8 are **contained** in the engine surface (2 in conditions, 6 in props)
but `from_engine` returns 873 + 84 = 957 names for any spec, because
`get_style_prop_names()` is canon-global, not spec-driven.

**Named mismatch (slice-3's first red test):** the plan's round-trip as
worded — "`from_engine(fixture spec)` equals `from_declaration_root(neo
fixture)` … (the eight names)" (`styletrace.md` slice #3) — is
unstatable: no `BaseSystem` yields an 8-name prop surface. Restate as:

1. containment: `from_declaration_root(neo fixture) ⊆ from_engine(any
   spec)` (the 8 names), plus
2. true round-trip: generate a full-size decl root from the fixture spec
   via typegen + the react-surface template, then assert equality; and
3. keep the real-tree canary (`loads_real_reference_core_style_props`
   extended): full equality 873 + 84, which *is* statable.

Suggested test name: `surface::fixture_names_are_contained_in_engine_surface`
(red until `from_engine` exists; the equality half lives in the round-trip
+ canary tests).

## Notes (not blockers)

1. **Authored conditions are invisible to the printer.** A world with
   custom `spec.conditions` gets them in `BaseSystem.conditions` (and the
   extractor honors them via `get_condition`) but not in
   `StyleConditionKey`. If `from_engine` enumerates `BaseSystem.conditions`
   keys, engine ⊃ disk on such worlds. Recommendation: `from_engine`
   replicates the printer exactly (canon + `@`bps) so both paths share the
   gap; custom-conditions-in-typegen is a typegen row (Overmatch
   candidate), never a slice-3 scope expansion. Side constraint:
   `ConditionMap` has **no key-enumeration API** (`condition_map.rs`: only
   `get`/`is_empty`) — enumerating needs a new accessor; replicating the
   printer needs none.
2. **`@sm` typechecks but mangles in the extractor.** `NEO-TYPE-04`
   pins `@sm` valid / bare `sm` invalid in `SystemStyleObject`, yet
   `lower_when("@sm")` falls to `at_rule_or_ampersand` →
   `When::selector("@sm", "[@sm]", "&:@sm")` (no `@`-strip anywhere on the
   path; no atomic test pins `@sm`). Live extractor grammar is plain `sm`
   + `smDown/smOnly/smToMd` ranges (`conditions/tests.rs:44-48`). Both
   surfaces share the `@sm` spelling, so this is not drift — but it is a
   real type↔extractor disconnect to file (typegen or Overmatch), since a
   user writing the type-blessed spelling gets `.cls:@sm` garbage.
3. **Extractor truth is wider than either surface**, symmetrically:
   plain `sm`, ranges, raw `@media/@container/@supports/&` spellings, and
   the 12-name preset fallback (`pseudoprops/mod.rs`) are accepted but
   never enumerated. The surface is the enumerable subset; both paths
   agree on it.
