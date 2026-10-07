# Crew brief — ARC1 — runtime family-relative `weight` (font-weight-runtime-1008)

You are a crew lead on a captain-led mission. Implement **Arc 1 only**. Do **not**
commit (the captain commits). Do not touch unrelated dirty files. Append a short
progress entry to `.agents/missions/font-weight-runtime-1008/LOG.md`. Report
changed files + test output when done.

## Objective (observable)

Bare keyword `weight` names must resolve against the active sibling family in
the **runtime** resolver, matching the Rust static resolver. After Arc 1,
`css({font:'sans', weight:'thin'})` must name `fontWeight: 200` (not the
`font-weight_100` class); `font:'serif' + weight:'normal'` → 373;
`font:'mono' + weight:'normal'` → 393; a lone `weight:'thin'` → 100.

## Root cause

Two resolvers; only the Rust static one was fixed
(`packages/reference-rs/modules/atomic/src/resolve/font/scope.rs`). The runtime
path — `packages/reference-neo/src/runtime/css/css.ts` (`collectEntries` /
`collectStyle` → `css()`) driving `packages/reference-rs/modules/atomic/js/namer/lower.ts`
(`weightPairs` = `scopedWeight ?? keywordWeight ?? raw`) — is family-blind.

## The approved design (Oracle PLAN.oracle, corrections mandatory)

Read `reports/PLAN.oracle.md` for full evidence. Implement exactly this:

1. **New module** `packages/reference-neo/src/runtime/css/scope.ts` — a 1:1 TS
   port of `scope.rs`'s `apply_to_wants` semantics:
   - `isFamilyProp`: `prop === 'font' || prop === 'fontFamily'`.
   - `isFamilyKey`: non-empty and every char `alphanumeric | '-' | '_'` (stacks
     like `"Inter", sans-serif` must NOT seed).
   - A **hardcoded six-keyword constant** `thin, light, normal, semibold, bold, black`
     (do NOT read `tables.weightKeywords` — F6).
   - Only rewrite when: value is a string, has no `.`, and is one of the six.
     Rewrite to `` `${family}.${value}` ``.
   - Family seeding and scope grouping mirror `scope.rs`:
     single family named by `font`/`fontFamily` in the **same `when` scope** wins;
     for a query whose `when` is non-empty and has no same-`when` family, fall
     back to the **base** scope (`when === []`); two different families in a
     scope → decline (no rewrite); a repeated same family is fine.
   - **Per `css()` call, not per style object (F1, P1):** the pass runs over the
     **whole `queries` array after every `collectStyle` call, before the naming
     loop** in `css()` — so `css(styleProps, cssProp)` scopes across args, exactly
     like the static oracle `static "One call, one family scope"`.
   - **String queries only (F3):** skip object-valued (responsive) queries; add a
     test pinning the interim behavior and leave a `// follow-up:` note that
     responsive leaf-descent needs a breakpoint-`when` decision.
   - Values arriving from `collectEntries` are already `!important`-stripped
     (clean string + `query.important`), so scope the clean string.
2. **Wire-in** in `css.ts`: call the scope pass after collection, before the
   `for (const query of queries)` naming loop.
3. **Do not change** `lower.ts` (F7/F4): no contract or `rulesVersion` change.

## Tests (must exist)

- Extend `packages/reference-neo/src/runtime/css/css.test.ts` TABLES so lowering
  is observable (F5): add the two macro lowerings (`font:[{macro:'font'}]`,
  `weight:[{macro:'weight'}]`), the `fontFamily`/`fontWeight` prefixes, a fonts
  table mirroring `packages/reference-lib/src/core/theme/fonts.ts`
  (`sans.thin=200`, `serif.normal=373`, `mono.normal=393`, plus the other names),
  and six `weightKeywords`. Port the nine `scope.rs` unit cases, then add:
  cross-arg scoping (font in one arg, weight in another), `thin!`-important,
  conditional (`_hover`/nested) same-group win + base fallback, family-less
  keyword, explicit `sans.thin` passthrough, numeric/unknown passthrough,
  conflicting-family decline, dynamic variable string scoped (F2), and the
  responsive interim pin (F3).

## Reference files

- Static reference: `packages/reference-rs/modules/atomic/src/resolve/font/scope.rs`
  (nine cases at the bottom).
- Static JSx proof: `packages/reference-rs/modules/atomic/src/extract/jsx/mod.rs`
  (`jsx_bare_weight_resolves_against_element_font`).
- Runtime site: `packages/reference-neo/src/runtime/css/css.ts`.
- Family data: `packages/reference-lib/src/core/theme/fonts.ts`.
- Oracle report: `.agents/missions/font-weight-runtime-1008/reports/PLAN.oracle.md`.

## Verification you must run (and report raw output)

Follow the `agent-neo` skill's loop for `packages/reference-neo`. Run the
narrowest vitest for the runtime css suite and paste pass/fail counts. Do not
run the full matrix. Do not commit.

## Constraints

- Match `scope.rs` exactly; no new behavior beyond the objective.
- No `@ts-ignore`, no `any`, keep functions small; the `agent-neo` quality gate
  (cognitive complexity 20, file 500 lines, `any` banned) must pass.
- Report: files changed, exact commands, raw test output, and any deviation.
